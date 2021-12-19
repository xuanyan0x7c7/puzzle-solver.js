import { WasmPuzzleSolver, initWasmPuzzleSolver } from '@xuanyan/puzzle-solver';
import { enumerate } from './iter-utils';

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

type Point = { x: number; y: number };

class Tile {
  private _points: Point[] = [];

  constructor(points: Point[]) {
    this._points = points
      .map(({ x, y }) => ({ x, y }))
      .sort((point1, point2) => {
        if (point1.y - point2.y < 0) {
          return -1;
        } else if (point1.y - point2.y > 0) {
          return 1;
        } else {
          return point1.x - point2.x;
        }
      });
    this.adjustPosition();
  }

  static parse(array: string[]) {
    const points: Point[] = [];
    for (let x = 0; x < array.length; ++x) {
      for (let y = 0; y < array[x].length; ++y) {
        if (array[x][y] === 'x') {
          points.push({ x, y });
        }
      }
    }
    return new Tile(points);
  }

  get points() {
    return this._points;
  }

  get(x: number, y: number) {
    return this._points.some(point => point.x === x && point.y === y);
  }

  clone() {
    return new Tile(this._points);
  }

  rotate() {
    return new Tile(this._points.map(({ x, y }) => ({ x: -y, y: x })));
  }

  flip() {
    return new Tile(this._points.map(({ x, y }) => ({ x: -x, y })));
  }

  hash() {
    return JSON.stringify(this._points);
  }

  private adjustPosition() {
    let minX = Infinity;
    let minY = Infinity;
    for (const { x, y } of this._points) {
      if (x < minX) {
        minX = x;
      }
      if (y < minY) {
        minY = y;
      }
    }
    for (const point of this._points) {
      point.x -= minX;
      point.y -= minY;
    }
  }
}

function generateTiles(tile: Tile, { rotate = true, flip = true } = {}) {
  const tileMap = new Map<string, Tile>();
  tileMap.set(tile.hash(), tile);
  if (rotate) {
    let rotatedTile = tile.clone();
    while (true) {
      rotatedTile = rotatedTile.rotate();
      const rotatedTileString = rotatedTile.hash();
      if (tileMap.has(rotatedTileString)) {
        break;
      }
      tileMap.set(rotatedTileString, rotatedTile);
    }
  }
  if (flip) {
    const flippedTile = tile.flip();
    const flippedTileString = flippedTile.hash();
    if (!tileMap.has(flippedTileString)) {
      tileMap.set(flippedTileString, flippedTile);
      if (rotate) {
        let rotatedTile = flippedTile.clone();
        while (true) {
          rotatedTile = rotatedTile.rotate();
          const rotatedTileString = rotatedTile.hash();
          if (tileMap.has(rotatedTileString)) {
            break;
          }
          tileMap.set(rotatedTileString, rotatedTile);
        }
      }
    }
  }
  return [...tileMap.values()];
}

function solvePuzzle() {
  const boardSize = { rows: 6, columns: 10 };
  const tiles = [
    [
      'xxxxx',
    ],
    [
      'x___',
      'xxxx',
    ],
    [
      '_x__',
      'xxxx',
    ],
    [
      'xx_',
      'xxx',
    ],
    [
      'x_x',
      'xxx',
    ],
    [
      '__xx',
      'xxx_',
    ],
    [
      'x__',
      'x__',
      'xxx',
    ],
    [
      '_x_',
      '_x_',
      'xxx',
    ],
    [
      '_x_',
      'xxx',
      '_x_',
    ],
    [
      'x__',
      'xxx',
      '_x_',
    ],
    [
      '__x',
      'xxx',
      'x__',
    ],
    [
      'x__',
      'xx_',
      '_xx',
    ],
  ].map(Tile.parse);

  const tileGroupList = tiles.map(tile => generateTiles(tile));
  const rowMapping: { tile: Tile; tileIndex: number; row: number; column: number }[] = [];

  const solver = new WasmPuzzleSolver();

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
            if (row + x >= boardSize.rows || column + y >= boardSize.columns
            ) {
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
  for (const row of overlappingList) {
    for (const rowIndices of row) {
      if (rowIndices.length > 0) {
        solver.addColumn(rowIndices);
      }
    }
  }

  for (const [solutionIndex, solution] of enumerate(solver.solve())) {
    if (solutionIndex === 0) {
      const board = create2DArray(boardSize.rows, boardSize.columns, () => 0);
      for (const rowChosen of solution) {
        const { tile, tileIndex, row, column } = rowMapping[rowChosen];
        for (const point of tile.points) {
          board[row + point.x][column + point.y] = tileIndex;
        }
      }
      process.stdout.write('┌');
      for (let c = 0; c < boardSize.columns; ++c) {
        if (c > 0) {
          process.stdout.write(board[0][c - 1] === board[0][c] ? '─' : '┬');
        }
        process.stdout.write('───');
      }
      console.log('┐');
      for (let r = 0; r < boardSize.rows; ++r) {
        if (r > 0) {
          process.stdout.write(board[r - 1][0] === board[r][0] ? '│' : '├');
          for (let c = 0; c < boardSize.columns; ++c) {
            const topRight = board[r - 1][c];
            const bottomRight = board[r][c];
            if (c > 0) {
              const topLeft = board[r - 1][c - 1];
              const bottomLeft = board[r][c - 1];
              if (topLeft === topRight) {
                if (bottomLeft === bottomRight) {
                  process.stdout.write(topLeft === bottomLeft ? ' ' : '─');
                } else if (topLeft === bottomLeft) {
                  process.stdout.write('┌');
                } else if (topRight === bottomRight) {
                  process.stdout.write('┐');
                } else {
                  process.stdout.write('┬');
                }
              } else if (bottomLeft === bottomRight) {
                if (topLeft === bottomLeft) {
                  process.stdout.write('└');
                } else if (topRight === bottomRight) {
                  process.stdout.write('┘');
                } else {
                  process.stdout.write('┴');
                }
              } else if (topLeft === bottomLeft) {
                process.stdout.write(topRight === bottomRight ? '│' : '├');
              } else {
                process.stdout.write(topRight === bottomRight ? '┤' : '┼');
              }
            }
            process.stdout.write(topRight === bottomRight ? '   ' : '───');
          }
          console.log(board[r - 1][boardSize.columns - 1] === board[r][boardSize.columns - 1] ? '│' : '┤');
        }
        process.stdout.write('│');
        for (let c = 0; c < board[r].length; ++c) {
          if (c > 0) {
            process.stdout.write(board[r][c - 1] === board[r][c] ? ' ' : '│');
          }
          process.stdout.write('   ');
        }
        console.log('│');
      }
      process.stdout.write('└');
      for (let c = 0; c < boardSize.columns; ++c) {
        if (c > 0) {
          process.stdout.write(board[boardSize.rows - 1][c - 1] === board[boardSize.rows - 1][c] ? '─' : '┴');
        }
        process.stdout.write('───');
      }
      console.log('┘');
    }
  }

  solver.free();
}

async function run() {
  await initWasmPuzzleSolver();
  console.time('solve puzzle');
  solvePuzzle();
  console.timeEnd('solve puzzle');
}

run().catch(err => console.error(err));
