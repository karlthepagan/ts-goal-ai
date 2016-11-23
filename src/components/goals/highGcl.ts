import Goal from "./goal";
import * as High from "./high";
import * as Medium from "./medium";
import GoalState from "../state/goalState";
import Plan from "./plan";

/**
 * expand territory and max out each controlled territory
 */
export default class GlobalControlIncrease extends Goal<Game, Room, GoalState> {
  constructor(plan: Plan<Game>) {
    super(plan);
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor);
  }

  public getGoalKey(): string {
    return High.GOAL_GCL;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  protected _identifyResources(state: GoalState): Room[] {
    return state.rooms();
  }

  protected _goalPriority(): string[] {
    // TODO genome
    return [
      Medium.GOAL_RCL, // room -> creep, spawn
    ];
  }
}
