import State from "./abstractState";
import RoomObjectState from "./roomObjectState";
import SourceState from "./sourceState";
import MineralState from "./mineralState";
import * as Keys from "../keys";
import Goal from "../goals/goal";

export default class RoomState extends State<Room> {
  public static left(obj: Room): RoomState {
    return RoomState._left.wrap(obj, obj.getMemory()) as RoomState;
  }

  public static right(obj: Room): RoomState {
    return RoomState._right.wrap(obj, obj.getMemory()) as RoomState;
  }

  private static _left: RoomState = new RoomState();
  private static _right: RoomState = new RoomState();

  public init() {
    if (super.init()) {
      console.log("room");

      // rooms don't have a pos, their name is their room id
      delete this._memory[Keys.LOCATION_POS];
      delete this._memory[Keys.LOCATION_ROOM];

      // iterate thru room objects and look up action fitness filter

      // not yet owned (usually)
      RoomObjectState.left(this._subject.controller);

      this._subject.find(FIND_SOURCES).forEach(SourceState.right);
      this._subject.find(FIND_MINERALS).forEach(MineralState.right);

      return true;
    }

    return false;
  }

  /**
   * Candidate resources
   */
  public getCandidates(): Creep[] {
    const candidates: Creep[] = [];

    for (let i in Game.creeps) {
      let creep = Game.creeps[i];

      creep = creep;
      // goal.insertCandidate(creep, candidates);
    }

    return candidates;
  }

  /**
   * Assigned resources
   */
  public getAssigned(goal: Goal<Room, any, any>): Creep[] {
    let assignments = this._memory[Keys.TASK_ASSIGNED_CREEPS];

    return (assignments[goal.getGoalKey()] as string[])
      .map((v) => Game.creeps[v]);
  }
}
