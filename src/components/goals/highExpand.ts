import Goal from "./goal";
import GoalState from "../state/goalState";
import * as High from "./high";
import Plan from "./plan";

/**
 * expand territory
 */
export default class Expand extends Goal<Game, Room, GoalState> {
  public static fromGoalState(state: GoalState): Game[] {
    return [ state.subject() ];
  }

  constructor(plan: Plan<Game>) {
    super(plan);
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor);
  }

  public getGoalKey(): string {
    return High.GOAL_EXPAND;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  protected _identifyResources(state: GoalState): Room[] {
    return state.rooms();
  }
}
