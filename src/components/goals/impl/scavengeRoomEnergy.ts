import Goal from "../goal";
import RoomState from "../../state/roomState";

class ScavengeRoomEnergy implements Goal<RoomState> {
  public subject: RoomState;
  public resources: any[];
}
