import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
import SourceState from "./sourceState";
import MineralState from "./mineralState";

export default class RoomState extends State<Room> {
  public static left(subject: Room) {
    return RoomState._left.wrap(subject, botMemory()) as RoomState;
  }

  public static right(subject: Room) {
    return RoomState._right.wrap(subject, botMemory()) as RoomState;
  }

  private static _left: RoomState = new RoomState("RoomStateLeft");
  private static _right: RoomState = new RoomState("RoomStateRight");

  protected _memAddress = ["rooms"];

  public toString() {
    return "[" + this._name + " " + this._id + "]";
  }

  public delete() {
    super.delete();

    log.debug("delete", this);
  }

  protected _getId(subject: Room) {
    return subject.name;
  }

  protected init(): boolean {
    if (this._memory.reset) {
      this.delete();
    }

    if (!super.init()) {
      if (!this.isVirtual()) {
        // sources
        this.subject().find(FIND_SOURCES).forEach(SourceState.left);

        // minerals
        this.subject().find(FIND_MINERALS).forEach(MineralState.left);
      }

      return false;
    }

    return true;
  }

  protected _resolve(id: string): Room {
    return Game.rooms[id];
  }
}
