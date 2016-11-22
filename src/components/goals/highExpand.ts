import Goal from "./goal";
import GoalState from "../state/goalState";
import * as High from "./high";
import {CandidateFactory} from "../filters";
import {goalStateActors} from "./goals";

/**
 * expand territory
 */
export default class Expand extends Goal<Game, Room, GoalState> {
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
    return High.GOAL_EXPAND;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  protected _identifyResources(state: GoalState): Room[] {
    return _.values(state.subject().rooms) as Room[];
  }

  protected _candidateActorFactory(): CandidateFactory<GoalState> {
    return goalStateActors;
  }
}
