import State from "./abstractState";

export default class RoomObjectState extends State<RoomObject> {
  public static left(obj: RoomObject|undefined): RoomObjectState|undefined {
    if (obj === undefined) {
      return undefined;
    }

    return RoomObjectState._left.wrap(obj, obj.getMemory()) as RoomObjectState;
  }

  public static right(obj: RoomObject|undefined): RoomObjectState|undefined {
    if (obj === undefined) {
      return undefined;
    }

    return RoomObjectState._right.wrap(obj, obj.getMemory()) as RoomObjectState;
  }

  private static _left = new RoomObjectState();
  private static _right = new RoomObjectState();

  public init() {
    if (super.init()) {
      console.log("roomobject");

      return true;
    }

    return false;
  }
}
