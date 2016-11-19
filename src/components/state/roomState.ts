import State from "./abstractState";
import RoomObjectState from "./objectState";
import SourceState from "./sourceState";
import MineralState from "./mineralState";

export default class RoomState extends State<Room> {
  public static spawn(obj: Room): RoomState {
    return RoomState._inst.wrap(obj, obj.getMemory());
  }

  private static _inst: RoomState = new RoomState();

  public init() {
    if (super.init()) {
      console.log("room");

      // iterate thru room objects and look up action fitness filter

      // not yet owned (usually)
      RoomObjectState.spawn(this.subject.controller);

      this.subject.find(FIND_SOURCES).forEach(SourceState.spawn);
      this.subject.find(FIND_MINERALS).forEach(MineralState.spawn);

      return true;
    }

    return false;
  }
}
