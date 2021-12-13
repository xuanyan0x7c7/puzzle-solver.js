class Node {
  up: Node;
  down: Node;
  left: Node;
  right: Node;

  constructor(public row: number, public column: number, rowHead: Node | null, columnHead: Node | null) {
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
}

type ConditionalState = {
  head: Node;
  holes: number;
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

export default class Solver {
  private head = new Node(-1, -1, null, null);
  private rows: Row[] = [];
  private columns: Column[] = [];
  private conditionalStates: ConditionalState[] = [];

  newConditionalConstraint(holes: number) {
    const head = new Node(-1, -1, null, null);
    const conditionalState: ConditionalState = { head, holes, currentHoles: 0, chaining: false };
    this.conditionalStates.push(conditionalState);
    return conditionalState;
  }

  addRows(rows: number) {
    const column = this.newColumn({ name: ColumnTypeName.Unique }, rows);
    for (let i = 0; i < rows; ++i) {
      this.rows.push({
        head: this.newNode(this.rows.length, null, column.head),
        chosen: false,
      });
    }
  }

  addColumn(rows: number[]) {
    const column = this.newColumn({ name: ColumnTypeName.Unique }, rows.length);
    for (const row of rows) {
      this.newNode(row, this.rows[row].head, column.head);
    }
  }

  addConditionalColumn(rows: number[], conditionalState: ConditionalState) {
    const column = this.newColumn({ name: ColumnTypeName.ConditionalUnique, conditionalState }, rows.length);
    for (const row of rows) {
      this.newNode(row, this.rows[row].head, column.head);
    }
  }

  addConstraint(rows: number[]) {
    const column = this.newColumn({ name: ColumnTypeName.Constraint }, rows.length);
    for (const row of rows) {
      this.newNode(row, this.rows[row].head, column.head);
    }
  }

  selectRow(row: number) {
    const rowItem = this.rows[row];
    for (const node of this.traverse(rowItem.head, 'right', { includeSelf: true })) {
      this.removeColumn(this.columns[node.column]);
    }
    rowItem.chosen = true;
  }

  deselectRow(row: number) {
    for (const node of this.traverse(this.rows[row].head, 'right', { includeSelf: true })) {
      if (node.up.down === node) {
        const columnItem = this.columns[node.column];
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
    if (this.conditionalStates.some(state => state.currentHoles > state.holes)) {
      return;
    } else if (this.head.right === this.head) {
      yield this.rows.map((row, index) => ({ row, index })).filter(({ row }) => row.chosen).map(({ index }) => index);
      return;
    }

    const newlyChainingStates: ConditionalState[] = [];
    for (const state of this.conditionalStates) {
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
      for (const rowNode of this.traverse(minColumn.head, 'down')) {
        this.rows[rowNode.row].chosen = true;
        for (const columnNode of this.traverse(rowNode, 'right')) {
          this.removeColumn(this.columns[columnNode.column]);
        }
        yield* this.solve();
        for (const columnNode of this.traverse(rowNode, 'left')) {
          this.resumeColumn(this.columns[columnNode.column]);
        }
        this.rows[rowNode.row].chosen = false;
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
      head: new Node(-1, this.columns.length, head, null),
      count,
    };
    this.columns.push(column);
    return column;
  }

  private* traverse(node: Node, direction: 'up' | 'down' | 'left' | 'right', { includeSelf = false } = {}) {
    if (includeSelf) {
      yield node;
    }
    for (let iter = node[direction]; iter !== node; iter = iter[direction]) {
      yield iter;
    }
  }

  private removeColumn(column: Column) {
    if (column.count === 0) {
      if (column.type.name === ColumnTypeName.ConditionalUnique) {
        --column.type.conditionalState.currentHoles;
      }
    }
    column.head.left.right = column.head.right;
    column.head.right.left = column.head.left;
    for (const rowNode of this.traverse(column.head, 'down')) {
      for (const columnNode of this.traverse(rowNode, 'right')) {
        const columnItem = this.columns[columnNode.column];
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
    for (const rowNode of this.traverse(column.head, 'up')) {
      for (const columnNode of this.traverse(rowNode, 'left')) {
        const columnItem = this.columns[columnNode.column];
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

    for (const node of this.traverse(this.head, 'right')) {
      const column = this.columns[node.column];
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

    for (const state of this.conditionalStates) {
      if (state.chaining) {
        for (const node of this.traverse(state.head, 'right')) {
          const column = this.columns[node.column];
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
