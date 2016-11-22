import Goal from "./goal";
import * as Low from "./low.ts";
import {CandidateFactory} from "../filters";
import RoomState from "../state/roomState";
import {roomStateActors} from "./goals";

export default class CreateCreep extends Goal<Room, Spawn, RoomState> {

  constructor(room: Room) {
    super();

    console.log("hello", this.getGoalKey(), room.name);
  }

  public getGoalKey(): string {
    return Low.GOAL_CREATE_CREEP;
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  protected _identifyResources(state: RoomState): Spawn[] {
    return state.subject().find(FIND_MY_SPAWNS) as Spawn[];
  }

  protected _candidateActorFactory(): CandidateFactory<RoomState> {
    return roomStateActors; // TODO controller filter
  }
}
