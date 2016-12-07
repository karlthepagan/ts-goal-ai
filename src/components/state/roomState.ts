import State from "./abstractState";
import {log} from "../support/log";
import {botMemory, FLYWEIGHTS} from "../../config/config";
import SourceState from "./sourceState";
import MineralState from "./mineralState";
import SpawnState from "./spawnState";
import RoomIterator from "../util/roomIterator";
import * as F from "../functions";

/**
 * TODO BSP this mofo? https://www.npmjs.com/package/bsp-tree
 */
export default class RoomState extends State<Room> {
  public static apiType() {
    return Room;
  }

  public static left(subject: Room) {
    return (FLYWEIGHTS ? RoomState._left : new RoomState("RS") ).wrap(subject, botMemory()) as RoomState;
  }

  public static right(subject: Room) {
    return (FLYWEIGHTS ? RoomState._right : new RoomState("RS") ).wrap(subject, botMemory()) as RoomState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? RoomState._vleft : new RoomState("RS") ).wrapRemote(id, botMemory()) as RoomState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? RoomState._vright : new RoomState("RS") ).wrapRemote(id, botMemory()) as RoomState;
  }

  private static _left: RoomState = new RoomState("RoomStateLeft");
  private static _right: RoomState = new RoomState("RoomStateRight");
  private static _vleft: RoomState = new RoomState("RoomStateVirtualLeft");
  private static _vright: RoomState = new RoomState("RoomStateVirtualRight");

  public className() {
    return "RoomState";
  }

  public delete() {
    super.delete();

    log.debug("delete", this);
  }

  public grid(): Iterable<RoomState> {
    return new RoomIterator(this.pos());
  }

  public eachSource<T>(f: (room: SourceState) => T): T[] {
    return _.chain(this._memory.sources).values()
      .map(SourceState.vright)
      .map(f)
      .value();
  }

  public eachMineral<T>(f: (room: MineralState) => T): T[] {
    return _.chain(this._memory.minerals).values()
      .map(MineralState.vright)
      .map(f)
      .value();
  }

  protected _accessAddress() {
    return ["rooms"];
  }

  protected _indexAddress() {
    return ["index", "rooms"];
  }

  protected _getId(subject: Room) {
    return subject.name;
  }

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
      if (!this.isRemote()) {
        // sources
        const sources = this.subject().find(FIND_SOURCES)
          .map(SourceState.left) // side-effect, source states initialized
          .map(s => [ F.posAsStr(s.pos()), s.getId() ] );
        this.memory().sources = _.object(sources);

        // minerals
        const minerals = this.memory().minerals = this.subject().find(FIND_MINERALS)
          .map(MineralState.left) // side-effect, mineral states initialized
          .map(s => [ F.posAsStr(s.pos()), s.getId() ] );
        this.memory().minerals = _.object(minerals);

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
