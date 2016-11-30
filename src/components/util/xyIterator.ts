import * as F from "../functions";

/**
 * An endless iterator which advances in a square box beginning at the top-left.
 *
 *     67 68 69 70 71
 *  19 P
 *  18 O  9  A  B  C
 *  17 N  8  1  2  D
 *  16 M  7  0  3  E
 *  15 L  6  5  4  F
 *  14 K  J  I  H  G
 */
export default class XYIterator<T extends F.XY> implements Iterator<T> {
  public y: number;
  public x: number;
  public _ring = 0;
  private _dir = TOP; // dir of next step
  private _step = 2;

  constructor(xy: T) { // TODO borders
    this.x = xy.x;
    this.y = xy.y + 1; // debit y's position accounting for first step
  }

  /**
   * Useful for heuristic to stop searching when hitting invalid locations.
   */
  public depth(): number {
    return this._ring;
  }

  public next(): IteratorResult<T> {
    F.dirTransform(this, this._dir);

    --this._step;

    if (this._step <= 0) {
      this._step = 2 * this._ring;
      switch (this._dir) {
        case TOP:
          this._ring++;
          this._step++;
          this._dir = RIGHT;
          break;
        case RIGHT:
          this._dir = BOTTOM;
          break;
        case BOTTOM:
          this._dir = LEFT;
          break;
        case LEFT:
          this._step++;
          this._dir = TOP;
          break;
        default:
          throw new Error("illegal _dir=" + this._dir);
      }
    }

    return {
      done: false,
      value: {x: this.x, y: this.y},
    } as IteratorResult<T>;
  }
}
