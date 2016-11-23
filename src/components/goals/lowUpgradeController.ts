import Goal from "./goal";
import * as Low from "./low.ts";
import RoomState from "../state/roomState";
import Plan from "./plan";

export default class UpgradeController extends Goal<Room, Creep, RoomState> {

  constructor(plan: Plan<Room>) {
    super(plan);
  }

  public getGoalKey(): string {
    return Low.GOAL_UPGRADE_CONTROLLER;
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  protected _identifyResources(state: RoomState): Creep[] {
    // TODO creeps near this room (not just in)
    return state.creeps();
  }
}
