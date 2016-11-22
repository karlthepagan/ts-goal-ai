import Goal from "./goal";
import * as Low from "./low.ts";
import {CandidateFactory} from "../filters";
import RoomState from "../state/roomState";
import {roomStateActors} from "./goals";

export default class UpgradeController extends Goal<Room, Creep, RoomState> {

  constructor(room: Room) {
    super();

    console.log("hello", this.getGoalKey(), room.name);
  }

  public getGoalKey(): string {
    return Low.GOAL_UPGRADE_CONTROLLER;
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  protected _identifyResources(state: RoomState): Creep[] {
    // TODO creeps near this room (not just in)
    return state.subject().find(FIND_MY_CREEPS) as Creep[];
  }

  protected _candidateActorFactory(): CandidateFactory<RoomState> {
    return roomStateActors; // TODO controller filter
  }
}
