import State from "../state/abstractState";
import Goal from "./goal";

export default class Move implements Goal<Creep> {
  private dir: number;
  constructor(direction: number) {
    this.dir = direction;
  }

  public execute(state: State<Creep>, actor: Creep): void {
    let result: number = actor.move(this.dir);

    if (result < 0) {
      state.setFailure(this, actor, result);
    }
  }

  public canFinish(state: State<Creep>, actor: Creep): Task|undefined {
    state = state;
    return () => {
      actor.move(this.dir);
    };
  }

  public canProgress(state: State<Creep>): boolean {
    state = state;
    return true;
  }

  public getGoalId(): string|undefined {
    return "move" + this.dir;
  }

  public toString(): string {
    return this.getGoalId() as string;
  }
}
