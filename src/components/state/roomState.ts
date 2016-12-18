import State from "./abstractState";
import {log} from "../support/log";
import {botMemory, FLYWEIGHTS} from "../../config/config";
import SourceState from "./sourceState";
import MineralState from "./mineralState";
import RoomIterator from "../util/roomIterator";
import * as F from "../functions";
import StructureState from "./structureState";
import LoDashExplicitArrayWrapper = _.LoDashExplicitArrayWrapper;

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

  public sources(): LoDashExplicitArrayWrapper<SourceState> {
    return _.chain(this._memory.sources).values().map(SourceState.vright);
  }

  public minerals(): LoDashExplicitArrayWrapper<MineralState> {
    return _.chain(this._memory.minerals).values().map(MineralState.vright);
  }

  public rcl(): number {
    let rcl = this.memory().rcl;
    if (this.resolve()) {
      const controller = this.subject().controller;
      this.memory().rcl = rcl = controller ? controller.level : 0;
    }
    return rcl;
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

  protected init(rootMemory: any, callback?: LifecycleCallback<RoomState>): boolean {
    if (super.init(rootMemory, callback)) {
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
        this.subject().find(FIND_MY_SPAWNS).forEach(StructureState.left);

        const controller = this.subject().controller;
        this.memory().rcl = controller ? controller.level : 0;
      }

      if (callback !== undefined) {
        callback(this, State.LIFECYCLE_NEW);
      }

      return true;
    }

    return false;
  }

  protected _resolve(id: string): Room {
    return Game.rooms[id];
  }
}
