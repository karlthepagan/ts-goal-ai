import RoomState from "../state/roomState";
import GlobalState from "../state/globalState";

export default class ShouldSpawnBuilder implements FitnessHandler<GlobalState, RoomState> {
  public evaluate(context: GlobalState, state: RoomState): number[] {
    return [context.gcl(), state.rcl()];
  }
}
