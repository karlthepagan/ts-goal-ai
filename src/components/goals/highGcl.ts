import Goal from "./goal";
import * as High from "./high";
import * as Medium from "./medium";
import GoalState from "../state/goalState";
import {CandidateFactory} from "../filters";
import {goalStateActors} from "./goals";

/**
 * expand territory and max out each controlled territory
 */
export default class GlobalControlIncrease extends Goal<Game, Room, GoalState> {
  public static fromGoalState(state: GoalState): Game[] {
    return [ state.subject() ];
  }

  constructor() {
    super();

    console.log("hello", this.getGoalKey());
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor, Memory.goals);
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

  protected _candidateActorFactory(): CandidateFactory<GoalState> {
    return goalStateActors;
  }

  protected _goalPriority(): string[] {
    // TODO genome
    return [
      Medium.GOAL_RCL, // room -> creep, spawn
    ];
  }
}
