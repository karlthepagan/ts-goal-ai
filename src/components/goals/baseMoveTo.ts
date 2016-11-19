import State from "../state/abstractState";
import Goal from "./goal";

export default class MoveTo implements Goal<Creep> {
  private dir: any;
  constructor(direction: RoomPosition[]|PathStep[]|string) {
    this.dir = direction;
  }

  public execute(state: State<Creep>, actor: Creep): void {
    let result: number;
    if (this.dir.length > 1) {
      result = actor.moveByPath(this.dir);
    } else if (this.dir[0].direction !== undefined) {
      result = actor.move(this.dir[0].direction);
    } else {
      result = actor.moveTo(this.dir[0] as RoomPosition);
    }

    if (result < 0) {
      state.setFailure(this, actor, result);
    }
  }

  public canFinish(state: State<Creep>, actor: Creep): Task|undefined {
    state = state;
    if (this.dir.length > 1) {
      return undefined;
    } else {
      // TODO replace MoveTo with Move
      return () => {
        actor.moveTo(actor.memory._move as RoomPosition); // TODO move target
      };
    }
  }

  public canProgress(state: State<Creep>): boolean {
    state = state;
    return true;
  }

  public getGoalId(): string|undefined {
    return undefined;
  }
  public toString(): string {
    return "moveTo"; // TODO non-addressable
  }
}
