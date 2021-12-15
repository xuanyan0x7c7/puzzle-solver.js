export type Point = {
  x: number;
  y: number;
};

export interface GridType {
  latticeSize: Point;
  rotate(point: Point): Point;
  flip(point: Point): Point;
}

export class Tile {
  private _points: Point[] = [];

  constructor(points: Point[], private readonly gridType: GridType) {
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
    return this._points.slice();
  }

  get(x: number, y: number) {
    return this._points.some(point => point.x === x && point.y === y);
  }

  clone() {
    return new Tile(this._points, this.gridType);
  }

  rotate() {
    return new Tile(this._points.map(this.gridType.rotate), this.gridType);
  }

  flip() {
    return new Tile(this._points.map(this.gridType.flip), this.gridType);
  }

  hash() {
    return JSON.stringify(this._points);
  }

  generate({ rotate = true, flip = true } = {}) {
    const tileMap = new Map<string, Tile>();
    tileMap.set(this.hash(), this);
    if (rotate) {
      let rotatedTile = this.clone();
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
      const flippedTile = this.flip();
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

  protected adjustPosition() {
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
    if (minX % this.gridType.latticeSize.x !== 0) {
      --minX;
    }
    if (minY % this.gridType.latticeSize.y !== 0) {
      --minY;
    }
    for (const point of this._points) {
      point.x -= minX;
      point.y -= minY;
    }
  }
}
