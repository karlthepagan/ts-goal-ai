import GoalState from "../state/goalState";
import Plan from "./plan";
import * as High from "./high";
import Goal from "./goal";

/**
 * ai goal root
 */
export default class MasterGoal extends Goal<Game, Game, GoalState> {
  constructor() {
    super(undefined);
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor);
  }

  public elect(state: GoalState, plan: Plan<Game>[]): Plan<Game> {
    state = state;

    if (plan.length === 1) {
      return plan[0];
    }

    // TODO sort plans by priority, eliminate plans with lower priority allocated resources
    return plan[0];
  }

  public getGoalKey(): string {
    return High.GOAL_MASTER;
  }

  protected _goalPriority(): string[] {
    // TODO genome
    return [
      High.GOAL_DESIGN, // game -> null
      High.GOAL_STICKY, // game -> creeps, objects
      High.GOAL_EXPAND, // game -> room -> creep, spawn
      High.GOAL_GCL, // game -> room -> creep, spawn
    ];
  }

  protected _identifyResources(state: GoalState): Game[] {
    return [ state.subject() ];
  }
}
