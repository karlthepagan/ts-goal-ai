import Plan from "./plan";
import Goal from "./goal";
import * as High from "./high";
import GoalState from "../state/goalState";

/**
 * from the origin room, determine the next
 */
export default class ScoutRoom implements Goal<Game, Creep, GoalState> {
  constructor(actor: Game) {
    actor = actor;

    console.log("hello ", this.getGoalKey());
  }

  public state(actor: Game): GoalState {
    return GoalState.build(actor, Memory.goals);
  }

  public plan(state: GoalState): Plan<Creep> {
    state = state;

    return new Plan<Creep>(this, {} as Creep);
  }

  public elect(state: GoalState, plan: Plan<Creep>): Plan<Creep> {
    state = state;
    plan = plan;

    return new Plan<Creep>(this, {} as Creep);
  }

  public execute(actor: Game, state: GoalState, plan: Plan<Creep>): Plan<Creep>[] {
    actor = actor;
    state = state;
    plan = plan;

    return [];
  }

  public resolve(failures: Plan<Creep>[]): Plan<Creep>|any {
    failures = failures;

    return undefined;
  }

  public getGoalKey(): string {
    return High.GOAL_SCOUT;
  }

  public toString(): string {
    return "scout room";
  }
}
