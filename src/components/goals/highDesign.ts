import Plan from "./plan";
import Goal from "./goal";
import * as High from "./high";
import GoalState from "../state/goalState";

/**
 * calculate creep build inventory
 *
 * TODO PathFinder.search(origin, goal, { swampCost: 1} ) - use this to plan roads
 * so basically I might use PathFinder.search( x, x, {swampCost:1}) to find distances
 * between my poi's then use ACO to figure out which ones I need to build roads on first
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
