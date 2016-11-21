import Goal from "./goal";
import GoalState from "../state/goalState";
import Plan from "./plan";
import * as High from "./high";

/**
 * expand territory and max out each controlled territory
 */
export default class Expand implements Goal<Game, Room, GoalState> {
  constructor() {
    console.log("hello ", this.getGoalKey());
  }

  public plan(state: GoalState): Plan<Room> {
    state = state;

    for (const name in state.subject().rooms) {
      const room = state.subject().rooms[name];
      // build candidate goals for all visible rooms, this cascades into rooms in memory
      console.log("plan ", name); // TODO impl
    }

    return new Plan<Room>(null, null);
  }

  public elect(state: GoalState, plan: Plan<Room>): Plan<Room> {
    state = state;
    plan = plan;

    return new Plan<Room>(null, null);
  }

  public execute(actor: Game, state: GoalState, plan: Plan<Room>): Plan<Room>[] {
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
    return High.GOAL_EXPAND;
  }

  public toString(): string {
    return this.getGoalKey();
  }
}
