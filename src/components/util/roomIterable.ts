import RoomState from "../state/roomState";
import RoomIterator from "./roomIterator";

export default class RoomIterable implements Iterable<RoomState> {
  private _start: RoomPosition;

  constructor(start: RoomPosition) {
    this._start = start;

  }

  public [Symbol.iterator](): Iterator<RoomState> {
    return new RoomIterator(this._start.roomName);
  }
}
