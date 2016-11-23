import State from "./abstractState";
import * as Keys from "../keys";

export default class CreepState extends State<Creep> {
  public static left(obj: Creep): CreepState {
    return CreepState._left.wrap(obj.id, obj, obj.getMemory()) as CreepState;
  }

  public static right(obj: Creep): CreepState {
    return CreepState._right.wrap(obj.id, obj, obj.getMemory()) as CreepState;
  }

  private static _left = new CreepState();
  private static _right = new CreepState();

  public init(): boolean {
    if (super.init()) {

      return true;
    }

    return false;
  }

  public toString() {
    return "[CreepState " + this._key + "]";
  }

  public isAllocated(): boolean {
    const v = this.memory()[Keys.TASK_ASSIGNED_CREEPS];
    return v !== undefined;
  }

  public allocate(task: any) {
    if (task !== undefined) {
      this.memory()[Keys.TASK_ASSIGNED_CREEPS] = task;
    } else {
      delete this.memory()[Keys.TASK_ASSIGNED_CREEPS];
    }
  }
}
