import State from "./abstractState";
import RoomState from "./roomState";
import * as Filters from "../filters";

export default class RoomObjectState<T extends RoomObject> extends State<T> {
  public static left<U extends RoomObject & {id: string}>(obj: U): RoomObjectState<U> {
    return RoomObjectState._left.wrap(obj.id, obj, obj.getMemory()) as RoomObjectState<U>;
  }

  public static right<U extends RoomObject & {id: string}>(obj: U): RoomObjectState<U> {
    return RoomObjectState._right.wrap(obj.id, obj, obj.getMemory()) as RoomObjectState<U>;
  }

  private static _left = new RoomObjectState<RoomObject>();
  private static _right = new RoomObjectState<RoomObject>();

  public init() {
    if (super.init()) {
      console.log("roomobject", this.subject());

      return true;
    }

    return false;
  }

  public parent(): RoomState {
    return RoomState.right(this.subject().room);

    // let room = this.subject().room;
    // const roomName = this.subject().pos.roomName;
    // if (room !== undefined) {
    //   return RoomState.right(room);
    // }
    // console.log("can't see", roomName);
    //
    // room = Game.rooms[roomName];
    // if (room !== undefined) {
    //   return RoomState.right(room);
    // }
    // console.log("can't resolve", roomName);
    //
    // return RoomState.remote(roomName);
  }

  public toString() {
    return "[RoomObjectState " + Filters.posAsStr(this.subject().pos) + "]";
  }
}
