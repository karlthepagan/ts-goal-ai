import Goal from "./goal";
import * as Medium from "./medium";
import GoalState from "../state/goalState";
import Plan from "./plan";

/**
 * from the origin room, determine the next
 */
export default class ScoutRoom extends Goal<Game, Room, GoalState> {
  public static fromGoalState(state: GoalState): Room[] {
    return state.rooms(); // TODO neighboring rooms
  }

  constructor(plan: Plan<Game>) {
    super(plan);
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor);
  }

  // TODO examine border rooms which are not present in memory, add them and assign creeps based on proximity

  public getGoalKey(): string {
    return Medium.GOAL_SCOUT;
  }

  public toString(): string {
    return "scout room";
  }

  protected _identifyResources(state: GoalState): Room[] {
    return ScoutRoom.fromGoalState(state);
  }
}
