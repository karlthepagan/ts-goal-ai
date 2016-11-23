import State from "./abstractState";
import * as Tasks from "../tasks";
import * as Keys from "../keys";
import * as Filters from "../filters";
import RoomState from "./roomState";

export default class SourceState extends State<Source> {
  public static left(obj: Source): SourceState {
    return SourceState._left.wrap(obj, obj.getMemory()) as SourceState;
  }

  public static right(obj: Source): SourceState {
    return SourceState._right.wrap(obj, obj.getMemory()) as SourceState;
  }

  private static _left = new SourceState();
  private static _right = new SourceState();

  public init(): boolean {
    if (super.init()) {
      this.memory()[Keys.OBJECT_WORK_POSITIONS] = Tasks.findOpenPositions(this.subject().pos, 1);

      return true;
    }

    return false;
  }

  public locations(): RoomPosition[] {
    return Tasks.strToRoomPosition(
      this.memory()[Keys.OBJECT_WORK_POSITIONS],
      this.subject().room.name);
  }

  public toString() {
    return "[SourceState " + Filters.posAsStr(this.subject().pos) + "]";
  }

  public parent(): RoomState {
    return RoomState.right(this.subject().room);
  }
}
