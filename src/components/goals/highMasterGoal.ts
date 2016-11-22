import GoalState from "../state/goalState";
import Plan from "./plan";
import * as High from "./high";
import Goal from "./goal";
import {CandidateFactory} from "../filters";
import {goalStateActors} from "./goals";

const priority: string[] = [
  High.GOAL_EXPAND,
  High.GOAL_RCL,
];

/**
 * ai goal root
 */
export default class MasterGoal extends Goal<Game, Game, GoalState> {
  constructor() {
    super();

    console.log("hello", this.getGoalKey());
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor, Memory.goals);
  }

  public elect(state: GoalState, plan: Plan<Game>[]): Plan<Game> {
    state = state;

    if (plan.length === 1) {
      return plan[0];
    }

    // TODO sort plans by priority, eliminate plans with higher priority allocated resources
    return plan[0];
  }

  public execute(actor: Game, plan: Plan<Game>): Plan<Game>[] {
    actor = actor;
    plan = plan;

    for (let task of plan.next()) {
      task.goal().execute(actor, task.resource());
    }

    return [];
  }

  public resolve(failures: Plan<Game>[]): Plan<Game>[]|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return High.GOAL_MASTER;
  }

  protected _goalPriority(): string[] {
    // TODO genome
    return priority;
  }

  protected _identifyResources(state: GoalState): Game[] {
    return [ state.subject() ];
  }

  protected _candidateActorFactory(): CandidateFactory<GoalState> {
    return goalStateActors;
  }
}
