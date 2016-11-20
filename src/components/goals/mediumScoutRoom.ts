import State from "../state/abstractState";
import Goal from "./goal";
import * as Keys from "../keys";

export default class ScoutRoom implements Goal<Creep> {
  public getGoalKey(): string {
    return Keys.GOAL_SCOUT;
  }

  public getGoalId(): string|undefined {
    return undefined;
  }

  public execute(state: State<Creep>, actor: Creep): void {
    state = state;
    actor = actor;
  }

  public canFinish(state: State<Creep>, actor: Creep): Task|undefined {
    state = state;
    actor = actor;
    return undefined;
  }

  public canProgress(state: State<Creep>): boolean {
    state = state;
    return false;
  }
}
