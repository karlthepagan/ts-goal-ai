import XYIterator from "./xyIterator";

export default class PositionIterable extends XYIterator<RoomPosition> implements Iterable<RoomPosition> {
  private _start: RoomPosition;
  private _minY: number | undefined;
  private _rangeStart: number | undefined;

  constructor(start: RoomPosition, rangeStart?: number, rangeLimit?: number) {
    super(start, rangeStart);
    this._start = start;
    this._rangeStart = rangeStart;
    this._minY = rangeLimit ? start.y - rangeLimit : undefined;
  }

  public [Symbol.iterator](): Iterator<RoomPosition> {
    return new PositionIterable(this._start, this._rangeStart);
  }

  public next(): IteratorResult<RoomPosition> {
    const next = super.next() as IteratorResult<RoomPosition>;
    if (next.value.y < this._minY) {
      return { done: true } as any;
    }
    next.value = new RoomPosition(next.value.x, next.value.y, this._start.roomName);
    return next;
  }
}
