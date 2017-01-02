import Goal from "../goal";
import GlobalState from "../../state/globalState";
import RoomState from "../../state/roomState";
import {log} from "../../support/log";

export default class GlobalEnergyTransportVelocity implements Goal<GlobalState> {
  public subject: GlobalState;
  public resources: any[];
  public resourceGoals: Goal<any>[][];

  public addResource<X>(resource: X): Goal<X>[] {
    if (resource instanceof RoomState) {
      const room = resource as RoomState;
      // TODO subscribe to new enemies
      // subscribe to ???

      // room.sources().map()
      // room goals for energy - harvest, transport & scavenge

      // energy sinks contribute to transport velocity by reducing range
      log.error("TODO boot up room goals", room);

      return [];
    }

    return [];
  }
}

// TODO
