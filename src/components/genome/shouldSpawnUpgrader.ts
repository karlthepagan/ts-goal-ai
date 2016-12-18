import RoomState from "../state/roomState";
import GlobalState from "../state/globalState";

export default class ShouldSpawnUpgrader implements FitnessHandler<GlobalState, RoomState> {
  public evaluate(context: GlobalState, state: RoomState): number[] {
    return [context.gcl(), state.rcl()];
  }
}
