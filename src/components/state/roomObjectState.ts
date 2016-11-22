import State from "./abstractState";

export default class RoomObjectState<T extends RoomObject> extends State<T> {
  public static left<U extends RoomObject>(obj: U): RoomObjectState<U> {
    return RoomObjectState._left.wrap(obj, obj.getMemory()) as RoomObjectState<U>;
  }

  public static right<U extends RoomObject>(obj: U): RoomObjectState<U> {
    return RoomObjectState._right.wrap(obj, obj.getMemory()) as RoomObjectState<U>;
  }

  private static _left = new RoomObjectState<RoomObject>();
  private static _right = new RoomObjectState<RoomObject>();

  public init() {
    if (super.init()) {
      console.log("roomobject", this._subject);

      return true;
    }

    return false;
  }
}
