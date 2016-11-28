import * as F from "../functions";
import RoomState from "../state/roomState";
import XYIterator from "./xyIterator";

export default class RoomIterator implements Iterator<RoomState> {
  private _xyIter: XYIterator;

  constructor(roomName: string) { // TODO borders
    this._xyIter = new XYIterator(F.parseRoomName(roomName));
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
