import { WasmPuzzleSolver, initWasmPuzzleSolver } from '@xuanyan/puzzle-solver';

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
    return new Tile(this._points.map(({ x, y }) => ({ x: 1 - y, y: 1 + x + y })));
  }

  flip() {
    return new Tile(this._points.map(({ x, y }) => ({ x: -x - y, y })));
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
    if (minX % 3 !== 0) {
      --minX;
    }
    if (minY % 3 !== 0) {
      --minY;
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
  const boardSize = 42;
  const tiles = [
    new Tile([
      { x: 6, y: 0 },
      { x: 9, y: 0 },
      { x: 4, y: 1 },
      { x: 7, y: 1 },
      { x: 10, y: 1 },
      { x: 3, y: 3 },
      { x: 9, y: 3 },
      { x: 1, y: 4 },
      { x: 10, y: 4 },
      { x: 0, y: 6 },
      { x: 9, y: 6 },
      { x: 1, y: 7 },
      { x: 10, y: 7 },
      { x: 0, y: 9 },
      { x: 9, y: 9 },
      { x: 1, y: 10 },
      { x: 7, y: 10 },
      { x: 0, y: 12 },
      { x: 3, y: 12 },
      { x: 6, y: 12 },
      { x: 1, y: 13 },
      { x: 4, y: 13 },
    ]),
    new Tile([
      { x: 3, y: 0 },
      { x: 1, y: 1 },
      { x: 4, y: 1 },
      { x: 0, y: 3 },
      { x: 3, y: 3 },
      { x: 1, y: 4 },
      { x: 4, y: 4 },
      { x: 0, y: 6 },
      { x: 3, y: 6 },
      { x: 1, y: 7 },
      { x: 4, y: 7 },
      { x: 0, y: 9 },
      { x: 3, y: 9 },
      { x: 1, y: 10 },
    ]),
    new Tile([
      { x: 6, y: 0 },
      { x: 9, y: 0 },
      { x: 12, y: 0 },
      { x: 4, y: 1 },
      { x: 7, y: 1 },
      { x: 10, y: 1 },
      { x: 3, y: 3 },
      { x: 4, y: 4 },
      { x: 3, y: 6 },
      { x: 6, y: 6 },
      { x: 4, y: 7 },
      { x: 7, y: 7 },
      { x: 6, y: 9 },
      { x: 7, y: 10 },
      { x: 0, y: 12 },
      { x: 3, y: 12 },
      { x: 6, y: 12 },
      { x: 1, y: 13 },
      { x: 4, y: 13 },
    ]),
    new Tile([
      { x: 9, y: 0 },
      { x: 12, y: 0 },
      { x: 7, y: 1 },
      { x: 10, y: 1 },
      { x: 13, y: 1 },
      { x: 12, y: 3 },
      { x: 13, y: 4 },
      { x: 6, y: 6 },
      { x: 9, y: 6 },
      { x: 12, y: 6 },
      { x: 7, y: 7 },
      { x: 10, y: 7 },
      { x: 9, y: 9 },
      { x: 10, y: 10 },
      { x: 3, y: 12 },
      { x: 6, y: 12 },
      { x: 9, y: 12 },
      { x: 1, y: 13 },
      { x: 4, y: 13 },
      { x: 7, y: 13 },
    ]),
    new Tile([
      { x: 6, y: 0 },
      { x: 7, y: 1 },
      { x: 3, y: 3 },
      { x: 6, y: 3 },
      { x: 9, y: 3 },
      { x: 1, y: 4 },
      { x: 4, y: 4 },
      { x: 7, y: 4 },
      { x: 10, y: 4 },
      { x: 0, y: 6 },
      { x: 6, y: 6 },
      { x: 1, y: 7 },
      { x: 7, y: 7 },
      { x: 0, y: 9 },
      { x: 1, y: 10 },
      { x: 0, y: 12 },
      { x: 1, y: 13 },
    ]),
    new Tile([
      { x: 3, y: 0 },
      { x: 6, y: 0 },
      { x: 9, y: 0 },
      { x: 4, y: 1 },
      { x: 7, y: 1 },
      { x: 10, y: 1 },
      { x: 9, y: 3 },
      { x: 7, y: 4 },
      { x: 6, y: 6 },
      { x: 4, y: 7 },
      { x: 3, y: 9 },
      { x: 1, y: 10 },
      { x: 0, y: 12 },
      { x: 3, y: 12 },
      { x: 6, y: 12 },
      { x: 1, y: 13 },
      { x: 4, y: 13 },
    ]),
    new Tile([
      { x: 6, y: 0 },
      { x: 9, y: 0 },
      { x: 4, y: 1 },
      { x: 7, y: 1 },
      { x: 10, y: 1 },
      { x: 3, y: 3 },
      { x: 9, y: 3 },
      { x: 1, y: 4 },
      { x: 10, y: 4 },
      { x: 0, y: 6 },
      { x: 3, y: 6 },
      { x: 6, y: 6 },
      { x: 9, y: 6 },
      { x: 1, y: 7 },
      { x: 4, y: 7 },
      { x: 7, y: 7 },
      { x: 0, y: 9 },
      { x: 1, y: 10 },
      { x: 0, y: 12 },
      { x: 3, y: 12 },
      { x: 6, y: 12 },
      { x: 1, y: 13 },
      { x: 4, y: 13 },
    ]),
    new Tile([
      { x: 9, y: 0 },
      { x: 10, y: 1 },
      { x: 9, y: 3 },
      { x: 10, y: 4 },
      { x: 9, y: 6 },
      { x: 10, y: 7 },
      { x: 9, y: 9 },
      { x: 10, y: 10 },
      { x: 3, y: 12 },
      { x: 6, y: 12 },
      { x: 9, y: 12 },
      { x: 1, y: 13 },
      { x: 4, y: 13 },
      { x: 7, y: 13 },
    ]),
    new Tile([
      { x: 6, y: 0 },
      { x: 9, y: 0 },
      { x: 12, y: 0 },
      { x: 4, y: 1 },
      { x: 7, y: 1 },
      { x: 10, y: 1 },
      { x: 13, y: 1 },
      { x: 3, y: 3 },
      { x: 12, y: 3 },
      { x: 4, y: 4 },
      { x: 10, y: 4 },
      { x: 3, y: 6 },
      { x: 6, y: 6 },
      { x: 9, y: 6 },
      { x: 1, y: 7 },
      { x: 4, y: 7 },
      { x: 7, y: 7 },
      { x: 10, y: 7 },
      { x: 0, y: 9 },
      { x: 9, y: 9 },
      { x: 1, y: 10 },
      { x: 7, y: 10 },
      { x: 0, y: 12 },
      { x: 3, y: 12 },
      { x: 6, y: 12 },
      { x: 1, y: 13 },
      { x: 4, y: 13 },
    ]),
    new Tile([
      { x: 9, y: 0 },
      { x: 7, y: 1 },
      { x: 10, y: 1 },
      { x: 9, y: 3 },
      { x: 10, y: 4 },
      { x: 6, y: 6 },
      { x: 9, y: 6 },
      { x: 4, y: 7 },
      { x: 7, y: 7 },
      { x: 10, y: 7 },
      { x: 3, y: 9 },
      { x: 9, y: 9 },
      { x: 1, y: 10 },
      { x: 10, y: 10 },
      { x: 0, y: 12 },
      { x: 3, y: 12 },
      { x: 6, y: 12 },
      { x: 9, y: 12 },
      { x: 1, y: 13 },
      { x: 4, y: 13 },
      { x: 7, y: 13 },
    ]),
  ];
  const holes = [
    { x: 19, y: 1 },
    { x: 21, y: 0 },
    { x: 22, y: 1 },
    { x: 24, y: 0 },
    { x: 16, y: 4 },
    { x: 18, y: 3 },
    { x: 19, y: 4 },
    { x: 21, y: 3 },
    { x: 0, y: 21 },
    { x: 1, y: 19 },
    { x: 3, y: 18 },
    { x: 4, y: 16 },
    { x: 0, y: 24 },
    { x: 1, y: 22 },
    { x: 3, y: 21 },
    { x: 4, y: 19 },
    { x: 36, y: 0 },
    { x: 37, y: 1 },
    { x: 39, y: 0 },
    { x: 40, y: 1 },
    { x: 36, y: 3 },
    { x: 37, y: 4 },
    { x: 39, y: 3 },
    { x: 40, y: 4 },
    { x: 0, y: 36 },
    { x: 1, y: 37 },
    { x: 3, y: 36 },
    { x: 4, y: 37 },
    { x: 0, y: 39 },
    { x: 1, y: 40 },
    { x: 3, y: 39 },
    { x: 4, y: 40 },
    { x: 36, y: 21 },
    { x: 37, y: 19 },
    { x: 39, y: 18 },
    { x: 40, y: 16 },
    { x: 36, y: 24 },
    { x: 37, y: 22 },
    { x: 39, y: 21 },
    { x: 40, y: 19 },
    { x: 19, y: 37 },
    { x: 21, y: 36 },
    { x: 22, y: 37 },
    { x: 24, y: 36 },
    { x: 16, y: 40 },
    { x: 18, y: 39 },
    { x: 19, y: 40 },
    { x: 21, y: 39 },
  ];

  const tileGroupList = tiles.map(tile => generateTiles(tile));
  const rowMapping: { tile: Tile; tileIndex: number; row: number; column: number }[] = [];

  const solver = new WasmPuzzleSolver();

  const overlappingList = create2DArray<number[]>(boardSize, boardSize, () => []);
  let rowIndex = -1;
  let tileIndex = 0;
  for (const tileGroup of tileGroupList) {
    ++tileIndex;
    let totalCount = 0;
    for (const tile of tileGroup) {
      for (let row = 0; row < boardSize; row += 3) {
        for (let column = 0; column < boardSize; column += 3) {
          let canPut = true;
          for (const { x, y } of tile.points) {
            if (
              row + x >= boardSize
              || column + y >= boardSize
              || row + x + column + y < boardSize / 2 - 1
              || row + x + column + y > boardSize * 3 / 2 - 3
            ) {
              canPut = false;
              break;
            }
          }
          if (!canPut) {
            continue;
          }
          for (const hole of holes) {
            if (tile.get(hole.x - row, hole.y - column)) {
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
  const totalHoles = boardSize * boardSize / 6 - holes.length - tiles.map(tile => tile.points.length).reduce((x, y) => x + y);
  const constraint = solver.newConditionalConstraint(totalHoles);
  for (const row of overlappingList) {
    for (const rowIndices of row) {
      if (rowIndices.length > 0) {
        solver.addConditionalColumn(rowIndices, constraint);
      }
    }
  }

  for (const solution of solver.solve()) {
    const solutionBoard = create2DArray(boardSize, boardSize, () => 0);
    for (const rowChosen of solution) {
      const { tile, tileIndex, row, column } = rowMapping[rowChosen];
      for (const point of tile.points) {
        solutionBoard[row + point.x][column + point.y] = tileIndex;
      }
    }
    console.log(solutionBoard.map(row => row.join(' ')).join('\n'));
    break;
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
