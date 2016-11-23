import State from "./abstractState";
import * as Tasks from "../tasks";
import * as Keys from "../keys";
import * as Filters from "../filters";
import RoomState from "./roomState";
import CreepState from "./creepState";
import GoalState from "./goalState";

export default class SourceState extends State<Source> {
  public static left(obj: Source): SourceState {
    return SourceState._left.wrap(obj.id, obj, obj.getMemory()) as SourceState;
  }

  public static right(obj: Source): SourceState {
    return SourceState._right.wrap(obj.id, obj, obj.getMemory()) as SourceState;
  }

  public static vLeft(id: string): SourceState {
    return SourceState._left.wrap(id, null, Memory.objects[id]) as SourceState;
  }

  public static vRight(id: string): SourceState {
    return SourceState._right.wrap(id, null, Memory.objects[id]) as SourceState;
  }

  private static _left = new SourceState();
  private static _right = new SourceState();

  public init(): boolean {
    if (super.init()) {
      this.memory()[Keys.OBJECT_WORK_POSITIONS] = Tasks.findOpenPositions(this.subject().pos, 1);

      // put in index
      this.root().sourceIds().push(this._key);

      return true;
    }

    return false;
  }

  public harvestFrom(worker: Creep): number {
    if (this.isVirtual() && !this.resolve()) {
      return -999;
    }

    return worker.harvest(this.subject());
  }

  public locations(): RoomPosition[] {
    if (this.subject() === null) {
      return [];
    }

    return Tasks.strToRoomPosition(
      this.memory()[Keys.OBJECT_WORK_POSITIONS],
      this.subject().room.name);
  }

  public toString() {
    return "[SourceState " + this._key + "]";
  }

  public parent(): RoomState {
    return RoomState.right(this.subject().room);
  }

  public root(): GoalState {
    return GoalState.master();
  }

  public allocate(creep: CreepState, site: RoomPosition) {
    creep.allocate(this.subject().id);
    this.memory()[Filters.posAsStr(site)] = creep.subject().id;
  }

  public free(creep: CreepState, site: RoomPosition) {
    creep.allocate(undefined);
    delete this.memory()[Filters.posAsStr(site)];
  }
}
