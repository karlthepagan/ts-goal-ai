import XYIterator from "./xyIterator";
export default class PositionIterable extends XYIterator<RoomPosition> implements Iterable<RoomPosition> {
  private _start: RoomPosition;

  constructor(start: RoomPosition) {
    super(start);
    this._start = start;
  }

  public [Symbol.iterator](): Iterator<RoomPosition> {
    return new PositionIterable(this._start);
  }

  public next(): IteratorResult<RoomPosition> {
    const next = super.next() as IteratorResult<RoomPosition>;
    next.value = new RoomPosition(next.value.x, next.value.y, this._start.roomName);
    return next;
  }
}
