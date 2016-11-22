import Goal from "./goal";
import GoalState from "../state/goalState";
import Plan from "./plan";
import * as High from "./high";
import {CandidateFactory} from "../filters";
import {goalStateActors} from "./goals";

/**
 * expand territory
 */
export default class Sticky extends Goal<Game, any, GoalState> {
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

  public plan(state: GoalState): Plan<any>[] {
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

  protected _identifyResources(state: GoalState): any[] {
    state = state;

    // return _.values(state.subject().rooms) as Room[];
    return [];
  }

  protected _candidateActorFactory(): CandidateFactory<GoalState> {
    return goalStateActors;
  }
}
