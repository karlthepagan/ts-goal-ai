import Plan from "./plan";
import Goal from "./goal";
import * as High from "./high";
import GoalState from "../state/goalState";

/**
 * from the origin room, determine the next
 */
export default class ScoutRoom implements Goal<Game, Creep, GoalState> {
  constructor(room: Room) {
    console.log("hello ", this.getGoalKey(), room.name);
  }

  public plan(state: GoalState): Plan<Creep> {
    state = state;

    return new Plan<Creep>();
  }

  public elect(state: GoalState, plan: Plan<Creep>): Plan<Creep> {
    state = state;
    plan = plan;

    return new Plan<Creep>();
  }

  public execute(actor: Game, state: GoalState, plan: Plan<Creep>): Plan<Creep>[] {
    actor = actor;
    state = state;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Creep>[]): Plan<Creep>|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return High.GOAL_SCOUT;
  }

  public toString(): string {
    return "scout room";
  }
}
