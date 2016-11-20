import Goal from "./goal";
import * as Keys from "../keys";
import RoomState from "../state/roomState";

export default class CreateCreep implements Goal<Room, Spawn, RoomState> {
  constructor(spec: any) {
    console.log("hello ", this.getGoalKey());
  }

  public getGoalKey(): string {
    return Keys.GOAL_CREATE_CREEP;
  }

  public execute(state: RoomState, actor: Room): void {
    state = state;
    actor = actor;
  }

  public canFinish(state: RoomState, actor: Room): Task|undefined {
    state = state;
    actor = actor;
    return undefined;
  }

  public canProgress(state: RoomState): boolean {
    state = state;
    return true;
  }

  public takeResource(state: RoomState, actor: Room): boolean {
    return false;
  }

  public stealResource(state: RoomState, actor: Room): boolean {
    return false;
  }

  public getTasks(state: RoomState, actor: Room): Task[] {
    return undefined;
  }

  public getGoalId(): string|undefined {
    return undefined;
  }

  public toString(): string {
    return "create"; // TODO non-addressable
  }
}
