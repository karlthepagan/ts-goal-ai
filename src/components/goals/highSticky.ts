import Goal from "./goal";
import GoalState from "../state/goalState";
import Plan from "./plan";
import * as High from "./high";

/**
 * expand territory
 */
export default class Sticky extends Goal<Game, any, GoalState> {
  constructor(plan: Plan<Game>) {
    super(plan);
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor);
  }

  public plan(parent: Plan<Game>, state: GoalState): Plan<any>[] {
    parent = parent;
    state = state;

    // TODO deserialize plans from memory

    return [];
  }

  public getGoalKey(): string {
    return High.GOAL_STICKY;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  // TODO?
  // goal -> creep
  // goal -> object
}
