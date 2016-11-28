import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
import SourceState from "./sourceState";
import MineralState from "./mineralState";
import SpawnState from "./spawnState";
import RoomIterable from "../util/roomIterable";

/**
 * TODO BSP this mofo? https://www.npmjs.com/package/bsp-tree
 */
export default class RoomState extends State<Room> {
  public static left(subject: Room) {
    return RoomState._left.wrap(subject, botMemory()) as RoomState;
  }

  public static right(subject: Room) {
    return RoomState._right.wrap(subject, botMemory()) as RoomState;
  }

  public static vleft(id: string) {
    return RoomState._vleft.virtual(id, botMemory()) as RoomState;
  }

  public static vright(id: string) {
    return RoomState._vright.virtual(id, botMemory()) as RoomState;
  }

  private static _left: RoomState = new RoomState("RoomStateLeft");
  private static _right: RoomState = new RoomState("RoomStateRight");
  private static _vleft: RoomState = new RoomState("RoomStateVirtualLeft");
  private static _vright: RoomState = new RoomState("RoomStateVirtualRight");

  protected _accessAddress = ["rooms"];
  protected _indexAddress = ["index", "rooms"];

  public className() {
    return "RoomState";
  }

  public delete() {
    super.delete();

    log.debug("delete", this);
  }

  public grid(): Iterable<RoomState> {
    return new RoomIterable(this.pos());
  }

  protected _getId(subject: Room) {
    return subject.name;
  }

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
      if (!this.isVirtual()) {
        // sources
        this.subject().find(FIND_SOURCES).forEach(SourceState.left);

        // minerals
        this.subject().find(FIND_MINERALS).forEach(MineralState.left);

        // spawns
        this.subject().find(FIND_MY_SPAWNS).forEach(SpawnState.left);
      }

      return true;
    }

    return false;
  }

  protected _resolve(id: string): Room {
    return Game.rooms[id];
  }
}
