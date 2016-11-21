import GoalState from "../state/goalState";
import Plan from "./plan";
import * as High from "./high";
import Goal from "./goal";
import State from "../state/abstractState";
import {goals} from "./high";

type CandidateLambda = (state: GoalState) => any[];

const priority: string[] = [
  High.GOAL_EXPAND,
  High.GOAL_RCL,
  High.GOAL_SCOUT,
];

/**
 * ai goal root
 */
export default class MasterGoal implements Goal<Game, Game, GoalState> {
  private _candidateBuilders: { [key: string]: CandidateLambda } = {};

  constructor() {
    console.log("hello ", this.getGoalKey());

    this._candidateBuilders[High.GOAL_EXPAND] = State.prototype.subject;
    this._candidateBuilders[High.GOAL_RCL] = this.rooms;
    this._candidateBuilders[High.GOAL_SCOUT] = this.creeps;
  }

  public rooms(state: GoalState): Room[] {
    return _.values(state.subject().rooms) as Room[];
  }

  public creeps(state: GoalState): Creep[] {
    return _.values(state.subject().creeps) as Creep[];
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor, Memory.goals);
  }

  public plan(state: GoalState): Plan<Game> {
    state = state;

    const plan = new Plan<Game>(this, state.subject());

    for (const name of priority) {
      const candidates: any[] = this._candidateBuilders[name](state);

      for (const actor of candidates) {
        const goal = goals[name](actor);

        plan.add( goal.plan( goal.state(actor) ) );
      }
    }

    return plan;
  }

  public elect(state: GoalState, plan: Plan<Game>): Plan<Game> {
    state = state;
    plan = plan;

    return new Plan<Game>(this, state.subject());
  }

  public execute(actor: Game, state: GoalState, plan: Plan<Game>): Plan<Game>[] {
    actor = actor;
    state = state;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Game>[]): Plan<Game>|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return High.GOAL_MASTER;
  }

  public toString(): string {
    return this.getGoalKey();
  }
}
