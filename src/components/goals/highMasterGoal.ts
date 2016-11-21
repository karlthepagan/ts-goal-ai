import GoalState from "../state/goalState";
import Plan from "./plan";
import * as High from "./high";
import Goal from "./goal";

const priority: string[] = [
  High.GOAL_EXPAND,
  High.GOAL_RCL,
  High.GOAL_SCOUT,
];

/**
 * ai goal root
 */
export default class MasterGoal implements Goal<Game, Game, GoalState> {
  constructor() {
    console.log("hello ", this.getGoalKey());
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor, Memory.goals);
  }

  public plan(state: GoalState): Plan<Game>[] {
    if (state.isPaused()) {
      console.log("paused");
      return [];
    }

    const plan = new Plan<Game>(this, state.subject());

    for (const name of priority) {
      console.log("pri", name);

      let candidates: any[] = this.buildCandidateActors(name, state);

      for (const actor of candidates) {
        console.log("act", actor);

        const goal = High.goals[name](actor);

        console.log(goal);

        if (goal !== undefined) {
          plan.addAll( goal.plan(goal.state(actor)) );
        }
      }
    }

    return [ plan ];
  }

  public elect(state: GoalState, plan: Plan<Game>[]): Plan<Game> {
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

  public resolve(failures: Plan<Game>[]): Plan<Game>[]|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return High.GOAL_MASTER;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  protected buildCandidateActors(goalName: string, state: GoalState): any[] {
    let candidates: any[] = High.goalStateActors[goalName](state);
    if (candidates === undefined) {
      return [];
    }
    return candidates;
  }
}
