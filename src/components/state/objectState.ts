import State from "./abstractState";

export default class RoomObjectState extends State<RoomObject> {
  public static spawn(obj: RoomObject|undefined): RoomObjectState|undefined {
    if (obj === undefined) {
      return undefined;
    }

    return RoomObjectState._inst.wrap(obj, obj.getMemory());
  }

  private static _inst = new RoomObjectState();

  public init() {
    if (super.init()) {
      console.log("roomobject");

      return true;
    }

    return false;
  }
}
