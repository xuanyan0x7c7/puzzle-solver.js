class Node {
  up: Node;
  down: Node;
  left: Node;
  right: Node;

  constructor(public row: number, public column: number, rowHead: Node | null = null, columnHead: Node | null = null) {
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

type Row = { head: Node; choose: boolean };
type Column = { head: Node; count: number };

export default class Solver {
  private head = new Node(-1, -1);
  private rows: Row[] = [];
  private columns: Column[] = [];

  addRows(rows: number) {
    const columnIndex = this.columns.length;
    const column: Column = {
      head: new Node(-1, columnIndex, this.head, null),
      count: rows,
    };
    this.columns.push(column);
    for (let i = 0; i < rows; ++i) {
      this.rows.push({
        head: new Node(this.rows.length, columnIndex, null, column.head),
        choose: false,
      });
    }
  }

  addColumn(rows: number[]) {
    const columnIndex = this.columns.length;
    const column: Column = {
      head: new Node(-1, columnIndex, this.head, null),
      count: rows.length,
    };
    this.columns.push(column);
    for (const row of rows) {
      new Node(row, columnIndex, this.rows[row].head, column.head);
    }
  }

  addConstraint(rows: number[]) {
    const columnIndex = this.columns.length;
    const column: Column = {
      head: new Node(-1, columnIndex, this.head, null),
      count: rows.length,
    };
    this.columns.push(column);
    for (const row of rows) {
      new Node(row, columnIndex, this.rows[row].head, column.head);
    }
  }

  * solve(): Generator<number[], void, void> {
    if (this.head.right === this.head) {
      yield this.rows.map((row, index) => ({ row, index })).filter(({ row }) => row.choose).map(({ index }) => index);
      return;
    }

    const minColumn = this.pickBestColumn();
    if (minColumn == null) {
      return;
    }

    this.removeColumn(minColumn);
    for (const rowNode of this.traverse(minColumn.head, 'down')) {
      this.rows[rowNode.row].choose = true;
      for (const columnNode of this.traverse(rowNode, 'right')) {
        this.removeColumn(this.columns[columnNode.column]);
      }
      yield* this.solve();
      for (const columnNode of this.traverse(rowNode, 'left')) {
        this.resumeColumn(this.columns[columnNode.column]);
      }
      this.rows[rowNode.row].choose = false;
    }
    this.resumeColumn(minColumn);
  }

  private* traverse(node: Node, direction: 'up' | 'down' | 'left' | 'right') {
    for (let iter = node[direction]; iter !== node; iter = iter[direction]) {
      yield iter;
    }
  }

  private removeColumn(column: Column) {
    column.head.left.right = column.head.right;
    column.head.right.left = column.head.left;
    for (const rowNode of this.traverse(column.head, 'down')) {
      for (const columnNode of this.traverse(rowNode, 'right')) {
        --this.columns[columnNode.column].count;
        columnNode.up.down = columnNode.down;
        columnNode.down.up = columnNode.up;
      }
    }
  }

  private resumeColumn(column: Column) {
    for (const rowNode of this.traverse(column.head, 'up')) {
      for (const columnNode of this.traverse(rowNode, 'left')) {
        ++this.columns[columnNode.column].count;
        columnNode.up.down = columnNode;
        columnNode.down.up = columnNode;
      }
    }
    column.head.left.right = column.head;
    column.head.right.left = column.head;
  }

  private pickBestColumn() {
    let min = Infinity;
    let minColumn: Column | null = null;

    for (const node of this.traverse(this.head, 'right')) {
      const column = this.columns[node.column];
      if (column.count < min) {
        minColumn = column;
        min = column.count;
        if (min === 1) {
          break;
        } else if (min === 0) {
          return null;
        }
      }
    }

    return minColumn;
  }
}
