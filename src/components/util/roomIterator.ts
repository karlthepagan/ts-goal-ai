import * as F from "../functions";
import RoomState from "../state/roomState";
import XYIterator from "./xyIterator";

export default class RoomIterator implements Iterator<RoomState>, Iterable<RoomState> {
  private _start: RoomPosition;
  private _xyIter: XYIterator<F.XY>;

  constructor(start: RoomPosition) {
    this._start = start;
    this._xyIter = new XYIterator<F.XY>(F.parseRoomName(start.roomName));
  }

  public [Symbol.iterator](): Iterator<RoomState> {
    // TODO iterable iterator clones?
    return new RoomIterator(this._start);
  }

  public depth(): number {
    return this._xyIter.depth();
  }

  public next(): IteratorResult<RoomState> {

    // TODO box limit

    const xyNext: IteratorResult<F.XY> = this._xyIter.next();

    return {
      done: false,
      value: RoomState.vright(F.formatRoomName(xyNext.value)),
    };
  }
}
