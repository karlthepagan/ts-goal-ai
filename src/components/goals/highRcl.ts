import Goal from "./goal";
import Plan from "./plan";
import * as High from "./high";
import RoomState from "../state/roomState";

/**
 * expand territory and max out each controlled territory
 */
export default class RoomControlLevel implements Goal<Room, Room, RoomState> {
  constructor() {
    console.log("hello ", this.getGoalKey());
  }

  public plan(state: RoomState): Plan<Room> {
    state = state;

    return new Plan<Room>();
  }

  public elect(state: RoomState, plan: Plan<Room>): Plan<Room> {
    state = state;
    plan = plan;

    return new Plan<Room>();
  }

  public execute(actor: Game, state: RoomState, plan: Plan<Room>): Plan<Room>[] {
    actor = actor;
    state = state;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Room>[]): Plan<Room>|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return High.GOAL_RCL;
  }

  public toString(): string {
    return this.getGoalKey();
  }
}
