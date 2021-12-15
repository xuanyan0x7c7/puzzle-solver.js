import BaseSolver from 'base-solver';

class Node {
  up: Node;
  down: Node;
  left: Node;
  right: Node;

  constructor(
    public readonly row: number,
    public readonly column: number,
    rowHead: Node | null,
    columnHead: Node | null
  ) {
    if (rowHead == null) {
      this.left = this.right = this;
    } else {
      this.left = rowHead.left;
      this.right = rowHead;
      this.left.right = this;
      rowHead.left = this;
    }
    if (columnHead == null) {
      this.up = this.down = this;
    } else {
      this.up = columnHead.up;
      this.down = columnHead;
      this.up.down = this;
      columnHead.up = this;
    }
  }

  * traverse(direction: 'up' | 'down' | 'left' | 'right', { includeSelf = false } = {}) {
    if (includeSelf) {
      yield this;
    }
    for (let iter = this[direction]; iter !== this; iter = iter[direction]) {
      yield iter;
    }
  }
}

type ConditionalState = {
  readonly head: Node;
  readonly holes: number;
  currentHoles: number;
  chaining: boolean;
};

enum ColumnTypeName {
  Unique,
  ConditionalUnique,
  Constraint
}

type ColumnType =
  { name: ColumnTypeName.Unique } |
  { name: ColumnTypeName.ConditionalUnique; conditionalState: ConditionalState } |
  { name: ColumnTypeName.Constraint };

type Row = { head: Node; chosen: boolean };
type Column = { type: ColumnType; head: Node; count: number };

export default class PuzzleSolver extends BaseSolver {
  private readonly head = new Node(-1, -1, null, null);
  private rowList: Row[] = [];
  private columnList: Column[] = [];
  private conditionalStateList: ConditionalState[] = [];

  free() {}

  newConditionalConstraint(holes: number) {
    const head = new Node(-1, -1, null, null);
    const conditionalIndex = this.conditionalStateList.length;
    this.conditionalStateList.push({ head, holes, currentHoles: 0, chaining: false });
    return conditionalIndex;
  }

  addRows(rowCount: number) {
    const column = this.newColumn({ name: ColumnTypeName.Unique }, rowCount);
    for (let i = 0; i < rowCount; ++i) {
      this.rowList.push({
        head: this.newNode(this.rowList.length, null, column.head),
        chosen: false,
      });
    }
  }

  addColumn(rows: number[]) {
    const column = this.newColumn({ name: ColumnTypeName.Unique }, rows.length);
    for (const row of rows) {
      this.newNode(row, this.rowList[row].head, column.head);
    }
  }

  addConditionalColumn(rows: number[], conditionalIndex: number) {
    const column = this.newColumn(
      { name: ColumnTypeName.ConditionalUnique, conditionalState: this.conditionalStateList[conditionalIndex] },
      rows.length
    );
    for (const row of rows) {
      this.newNode(row, this.rowList[row].head, column.head);
    }
  }

  addConstraint(rows: number[]) {
    const column = this.newColumn({ name: ColumnTypeName.Constraint }, rows.length);
    for (const row of rows) {
      this.newNode(row, this.rowList[row].head, column.head);
    }
  }

  selectRow(row: number) {
    const rowItem = this.rowList[row];
    for (const node of rowItem.head.traverse('right', { includeSelf: true })) {
      this.removeColumn(this.columnList[node.column]);
    }
    rowItem.chosen = true;
  }

  deselectRow(row: number) {
    for (const node of this.rowList[row].head.traverse('right', { includeSelf: true })) {
      if (node.up.down === node) {
        const columnItem = this.columnList[node.column];
        if (--columnItem.count === 0) {
          if (columnItem.type.name === ColumnTypeName.ConditionalUnique) {
            ++columnItem.type.conditionalState.currentHoles;
          }
        }
        node.up.down = node.down;
        node.down.up = node.up;
      }
    }
  }

  * solve(): Generator<number[], void, void> {
    if (this.conditionalStateList.some(state => state.currentHoles > state.holes)) {
      return;
    } else if (this.head.right === this.head) {
      yield this.rowList.map((row, index) => ({ row, index })).filter(({ row }) => row.chosen).map(({ index }) => index);
      return;
    }

    const newlyChainingStates: ConditionalState[] = [];
    for (const state of this.conditionalStateList) {
      if (!state.chaining && state.currentHoles === state.holes) {
        state.chaining = true;
        newlyChainingStates.push(state);
      }
    }

    do {
      const minColumn = this.pickBestColumn();
      if (minColumn == null) {
        break;
      }
      this.removeColumn(minColumn);
      for (const rowNode of minColumn.head.traverse('down')) {
        this.rowList[rowNode.row].chosen = true;
        for (const columnNode of rowNode.traverse('right')) {
          this.removeColumn(this.columnList[columnNode.column]);
        }
        yield* this.solve();
        for (const columnNode of rowNode.traverse('left')) {
          this.resumeColumn(this.columnList[columnNode.column]);
        }
        this.rowList[rowNode.row].chosen = false;
      }
      this.resumeColumn(minColumn);
    } while (false);

    for (const state of newlyChainingStates) {
      state.chaining = false;
    }
  }

  private newNode(row: number, rowHead: Node | null, columnHead: Node) {
    return new Node(row, columnHead.column, rowHead, columnHead);
  }

  private newColumn(columnType: ColumnType, count: number) {
    let head: Node | null = null;
    switch (columnType.name) {
      case ColumnTypeName.Unique:
        head = this.head;
        break;
      case ColumnTypeName.ConditionalUnique:
        head = columnType.conditionalState.head;
        break;
      default:
    }
    const column: Column = {
      type: columnType,
      head: new Node(-1, this.columnList.length, head, null),
      count,
    };
    this.columnList.push(column);
    return column;
  }

  private removeColumn(column: Column) {
    if (column.count === 0) {
      if (column.type.name === ColumnTypeName.ConditionalUnique) {
        --column.type.conditionalState.currentHoles;
      }
    }
    column.head.left.right = column.head.right;
    column.head.right.left = column.head.left;
    for (const rowNode of column.head.traverse('down')) {
      for (const columnNode of rowNode.traverse('right')) {
        const columnItem = this.columnList[columnNode.column];
        if (--columnItem.count === 0) {
          if (columnItem.type.name === ColumnTypeName.ConditionalUnique) {
            ++columnItem.type.conditionalState.currentHoles;
          }
        }
        columnNode.up.down = columnNode.down;
        columnNode.down.up = columnNode.up;
      }
    }
  }

  private resumeColumn(column: Column) {
    if (column.count === 0) {
      if (column.type.name === ColumnTypeName.ConditionalUnique) {
        ++column.type.conditionalState.currentHoles;
      }
    }
    column.head.left.right = column.head;
    column.head.right.left = column.head;
    for (const rowNode of column.head.traverse('up')) {
      for (const columnNode of rowNode.traverse('left')) {
        const columnItem = this.columnList[columnNode.column];
        if (columnItem.count++ === 0) {
          if (columnItem.type.name === ColumnTypeName.ConditionalUnique) {
            --columnItem.type.conditionalState.currentHoles;
          }
        }
        columnNode.up.down = columnNode;
        columnNode.down.up = columnNode;
      }
    }
  }

  private pickBestColumn() {
    let minColumn: Column | null = null;

    for (const node of this.head.traverse('right')) {
      const column = this.columnList[node.column];
      if (!minColumn || column.count < minColumn.count) {
        if (column.count === 1) {
          return column;
        } else if (column.count === 0) {
          return null;
        } else {
          minColumn = column;
        }
      }
    }

    for (const state of this.conditionalStateList) {
      if (state.chaining) {
        for (const node of state.head.traverse('right')) {
          const column = this.columnList[node.column];
          if (!minColumn || column.count < minColumn.count) {
            if (column.count === 1) {
              return column;
            } else if (column.count > 0) {
              minColumn = column;
            }
          }
        }
      }
    }

    return minColumn;
  }
}
