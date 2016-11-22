import RoomState from "../state/roomState";

export default class CollectEnergy {
  public static fromRoomState(state: RoomState): Creep[] {
    // all creeps are collect energy candidates
    return state.parent().creeps();
  }
}
