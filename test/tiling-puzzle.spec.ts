import * as assert from 'assert';
import { PuzzleSolver, WasmPuzzleSolver, initWasmPuzzleSolver } from '../dist';
import { count } from './iter-utils';
import { solvePuzzle } from './tiling-puzzle/square-grid';

const tTile = [
  '_x_',
  'xxx',
];
const shortLTile = [
  'x_',
  'xx',
];

const puzzles = {
  basic: {
    boardSize: { rows: 4, columns: 4 },
    tiles: new Array(4).fill(tTile),
  },
  oneHole: {
    boardSize: { rows: 4, columns: 4 },
    tiles: new Array(5).fill(shortLTile),
  },
};

describe('Tiling Puzzle', () => {
  beforeEach(() => initWasmPuzzleSolver());

  it('normal solver', () => {
    const solutionCount = count(
      solvePuzzle(
        new PuzzleSolver(),
        puzzles.basic.boardSize,
        puzzles.basic.tiles
      )
    );
    assert.strictEqual(solutionCount, 48);
  });

  it('wasm solver', () => {
    const solutionCount = count(
      solvePuzzle(
        new WasmPuzzleSolver(),
        puzzles.basic.boardSize,
        puzzles.basic.tiles
      )
    );
    assert.strictEqual(solutionCount, 48);
  });

  it('normal solver with one hole', () => {
    const solutionCount = count(
      solvePuzzle(
        new PuzzleSolver(),
        puzzles.oneHole.boardSize,
        puzzles.oneHole.tiles
      )
    );
    assert.strictEqual(solutionCount, 1920);
  });

  it('wasm solver with one hole', () => {
    const solutionCount = count(
      solvePuzzle(
        new WasmPuzzleSolver(),
        puzzles.oneHole.boardSize,
        puzzles.oneHole.tiles
      )
    );
    assert.strictEqual(solutionCount, 1920);
  });
});
