import RoomState from "../state/roomState";

export default class CollectEnergy {
  public static fromRoomState(state: RoomState): Creep[] {
    // all creeps are collect energy candidates
    return _.values(state.parent().subject().creeps) as Creep[];
  }
}
