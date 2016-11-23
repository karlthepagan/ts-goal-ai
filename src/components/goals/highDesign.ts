import Plan from "./plan";
import Goal from "./goal";
import * as High from "./high";
import GoalState from "../state/goalState";

/**
 * calculate creep build inventory
 */
export default class Design extends Goal<Game, any, GoalState> {
  constructor(plan: Plan<Game>) {
    super(plan);
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor);
  }

  public plan(parent: Plan<Game>, state: GoalState): Plan<any>[] {
    parent = parent;
    state = state;

    return [];
  }

  public getGoalKey(): string {
    return High.GOAL_DESIGN;
  }

  public toString(): string {
    return "design";
  }
}
