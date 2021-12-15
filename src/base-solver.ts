export default abstract class BaseSolver {
  abstract free(): void;
  abstract newConditionalConstraint(holes: number): number;
  abstract addRows(rowCount: number): void;
  abstract addColumn(rows: number[]): void;
  abstract addConditionalColumn(rows: number[], conditionalIndex: number): void;
  abstract addConstraint(rows: number[]): void;
  abstract selectRow(row: number): void;
  abstract deselectRow(row: number): void;
  abstract solve(): Generator<number[], void, void>;
}
