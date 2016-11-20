import Goal from "./goal";
import * as Keys from "../keys";
import {NOOP} from "../tasks";
import RoomState from "../state/roomState";

export default class StoreEnergy implements Goal<Room, RoomState> {
  constructor(room: string) {
    console.log("hello room");
  }

  public getGoalKey(): string {
    return Keys.GOAL_STORE_ENERGY;
  }

  public execute(state: RoomState, actor: Room): void {
    actor = actor;
  }

  public canFinish(state: RoomState, actor: Room): Task|undefined {
    state = state;

    if (actor.energyAvailable < actor.energyCapacityAvailable) {
      return undefined;
    }

    return NOOP;
  }

  public takeResource(state: RoomState, actor: Room): Task {
    return undefined;
  }

  public stealResource(state: RoomState, actor: Room): Task {
    return undefined;
  }

  public getTasks(state: RoomState, actor: Room): Task[] {
    return [];
  }

  public canProgress(state: RoomState): boolean {
    state = state;
    return true;
  }

  public getGoalId(): string|undefined {
    return undefined;
  }
  public toString(): string {
    return "storeEnergy"; // TODO non-addressable
  }
}
