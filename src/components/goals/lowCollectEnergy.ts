import RoomState from "../state/roomState";
import {roomStateActors} from "./goals";
import * as Low from "./low";

export default class CollectEnergy {
  public static fromRoomState(state: RoomState): Creep[] {
    // all creeps are collect energy candidates
    return _.values(state.parent().subject().creeps) as Creep[];
  }
}
roomStateActors[Low.GOAL_GET_ENERGY] = CollectEnergy.fromRoomState;
