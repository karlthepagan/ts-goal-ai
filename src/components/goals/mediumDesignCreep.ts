import RoomState from "../state/roomState";
import Plan from "./plan";
import Goal from "./goal";
import * as Medium from "./medium";

/**
 * calculate creep build inventory
 */
export default class DesignCreep implements Goal<Room, any, RoomState> {
  constructor(room: Room) {
    console.log("hello ", this.getGoalKey(), room.name);
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  public plan(state: RoomState): Plan<any>[] {
    state = state;

    return [ new Plan<Room>(this, state.subject()) ];
  }

  public elect(state: RoomState, plan: Plan<any>[]): Plan<any> {
    state = state;
    plan = plan;

    return new Plan<Room>(this, state.subject());
  }

  public execute(actor: Room, state: RoomState, plan: Plan<any>): Plan<any>[] {
    actor = actor;
    state = state;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<any>[]): Plan<any>[]|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return Medium.GOAL_DESIGN_CREEP;
  }

  public toString(): string {
    return "design creep";
  }
}
