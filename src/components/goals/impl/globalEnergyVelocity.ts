import Goal from "../goal";
import GlobalState from "../../state/globalState";
import RoomState from "../../state/roomState";
import {log} from "../../support/log";

export default class GlobalEnergyVelocity extends Goal<GlobalState> {
  public subject: GlobalState;
  public resources: any[];
  public resourceGoals: Goal<any>[][];

  public addResource<X>(resource: X): Goal<X>[] {
    if (resource instanceof RoomState) {
      const room = resource as RoomState;
      // room.sources().map()
      log.error("TODO boot up room goals", room);
    }

    return [];
  }
}
