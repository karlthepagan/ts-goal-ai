import State from "../state/abstractState";
import Goal from "./goal";
import * as Keys from "../keys";

export default class CreateCreep implements Goal<Spawn> {
  constructor(spec: any) {
    console.log("hello creep");
  }

  public getGoalKey(): string {
    return Keys.GOAL_MOVE_TO;
  }

  public execute(state: State<Spawn>, actor: Spawn): void {
    state = state;
    actor = actor;
  }

  public canFinish(state: State<Spawn>, actor: Spawn): Task|undefined {
    state = state;
    actor = actor;
    return undefined;
  }

  public canProgress(state: State<Spawn>): boolean {
    state = state;
    return true;
  }

  public getGoalId(): string|undefined {
    return undefined;
  }
  public toString(): string {
    return "create"; // TODO non-addressable
  }
}
