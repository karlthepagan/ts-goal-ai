import Goal from "./goal";
import * as Medium from "./medium";
import * as Low from "./low";
import {CandidateFactory} from "../filters";
import {roomStateActors} from "./goals";
import RoomState from "../state/roomState";

/**
 * exhaust all
 */
export default class EnergyVelocity extends Goal<Room, Creep, RoomState> {
  public static fromRoomState(state: RoomState): Room[] {
    return [ state.subject() ];
  }

  private _id: string;

  constructor(actor: Creep) {
    super();

    this._id = actor.id;

    console.log("hello", this.getGoalKey());
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  public getGoalKey(): string {
    return Medium.GOAL_ENERGY_VELOCITY;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  protected _identifyResources(state: RoomState): Creep[] {
    return state.parent().creeps(); // TODO filter creeps
  }

  protected _candidateActorFactory(): CandidateFactory<RoomState> {
    return roomStateActors;
  }

  protected _goalPriority(): string[] {
    // TODO genome
    return [
      Low.GOAL_GET_ENERGY, // creep
      Low.GOAL_STORE_ENERGY, // creep
    ];
  }
}
