import RoomState from "../state/roomState";
import GlobalState from "../state/globalState";

export default class ShouldSpawnMiner implements FitnessHandler<GlobalState, RoomState> {
  public evaluate(context: GlobalState, state: RoomState): number[] {
    context = context;
    return [state.rcl()];
  }
}
