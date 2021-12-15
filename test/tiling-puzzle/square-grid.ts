import type { BaseSolver } from '../../dist';
import { Tile } from './tile';
import type { GridType, Point } from './tile';

const SquareGrid: GridType = {
  latticeSize: { x: 1, y: 1 },
  rotate: ({ x, y }) => ({ x: -y, y: x }),
  flip: ({ x, y }) => ({ x: -x, y }),
};

function parseTile(array: string[]) {
  const points: Point[] = [];
  for (let x = 0; x < array.length; ++x) {
    for (let y = 0; y < array[x].length; ++y) {
      if (array[x][y] === 'x') {
        points.push({ x, y });
      }
    }
  }
  return new Tile(points, SquareGrid);
}

function create2DArray<T>(rows: number, columns: number, valueFn: () => T) {
  const array: T[][] = [];
  for (let i = 0; i < rows; ++i) {
    const row: T[] = [];
    for (let j = 0; j < columns; ++j) {
      row.push(valueFn());
    }
    array.push(row);
  }
  return array;
}

export function* solvePuzzle(
  solver: BaseSolver,
  boardSize: {rows: number; columns: number},
  tileStrings: string[][]
) {
  try {
    const basicTiles = tileStrings.map(s => parseTile(s));
    const tileGroupList = basicTiles.map(tile => tile.generate());
    const holes = boardSize.rows * boardSize.columns - basicTiles.map(tile => tile.points.length).reduce((x, y) => x + y, 0);
    const rowMapping: { tile: Tile; tileIndex: number; row: number; column: number }[] = [];

    const overlappingList = create2DArray<number[]>(boardSize.rows, boardSize.columns, () => []);
    let rowIndex = -1;
    let tileIndex = 0;
    for (const tileGroup of tileGroupList) {
      ++tileIndex;
      let totalCount = 0;
      for (const tile of tileGroup) {
        for (let row = 0; row < boardSize.rows; ++row) {
          for (let column = 0; column < boardSize.columns; ++column) {
            let canPut = true;
            for (const { x, y } of tile.points) {
              if (row + x >= boardSize.rows || column + y >= boardSize.columns) {
                canPut = false;
                break;
              }
            }
            if (!canPut) {
              continue;
            }
            rowMapping.push({ tile, tileIndex, row, column });
            ++rowIndex;
            ++totalCount;
            for (const point of tile.points) {
              overlappingList[row + point.x][column + point.y].push(rowIndex);
            }
          }
        }
      }
      solver.addRows(totalCount);
    }

    if (holes === 0) {
      for (const row of overlappingList) {
        for (const rowIndices of row) {
          if (rowIndices.length > 0) {
            solver.addColumn(rowIndices);
          }
        }
      }
    } else {
      const constraint = solver.newConditionalConstraint(holes);
      for (const row of overlappingList) {
        for (const rowIndices of row) {
          if (rowIndices.length > 0) {
            solver.addConditionalColumn(rowIndices, constraint);
          }
        }
      }
    }

    for (const solution of solver.solve()) {
      yield solution.map(row => rowMapping[row]);
    }
  } finally {
    solver.free();
  }
}
