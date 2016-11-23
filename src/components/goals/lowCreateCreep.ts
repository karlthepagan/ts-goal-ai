import Goal from "./goal";
import * as Low from "./low.ts";
import RoomState from "../state/roomState";
import Plan from "./plan";

export default class CreateCreep extends Goal<Room, Spawn, RoomState> {

  constructor(plan: Plan<Room>) {
    super(plan);
  }

  public getGoalKey(): string {
    return Low.GOAL_CREATE_CREEP;
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  protected _identifyResources(state: RoomState): Spawn[] {
    return state.spawns();
  }
}
