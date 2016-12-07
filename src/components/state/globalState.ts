import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
import RoomState from "./roomState";
import SpawnState from "./spawnState";
import SourceState from "./sourceState";
import MineralState from "./mineralState";
import CreepState from "./creepState";
import * as F from "../functions";
import LoDashExplicitArrayWrapper = _.LoDashExplicitArrayWrapper;

export default class GlobalState extends State<Game> {
  public static apiType() {
    return undefined;
  }

  /* TODO game score is sum of
   - add sum of all RCL * RCL weight
   - add sum of each room's energy velocity * venergy weight
   - add sum of all scored minerals * each minieral type weight
   - add sum of each secured mineral * each mineral type access weight (secured: military minimum score)
   - add sum of each room's military score minus sum of neighbor military score * military weight
   -- military score influenced by player military weight
   */
    // score all sources
    // score all minerals
    // score all creeps
    // score else?

  public static boot() {
    return GlobalState._game = new GlobalState("GlobalState").wrap(Game, botMemory()) as GlobalState;
  }

  public static game() {
    return GlobalState._game;
  }

  public static vright() {
    return GlobalState.game();
  }

  public static addDeleteHandler(key: string, handler: (memory: any) => void) {
    this._deleteHandler[key] = handler;
  }

  public static protectMemory(key: string) {
    this._deleteHandler[key] = F.NOOP();
  }

  protected static _deleteHandler: { [key: string]: (memory: any) => void } = {};

  private static _game: GlobalState;

  public className() {
    return "GlobalState";
  }

  public delete() {
    super.delete();

    log.debug("deleting", this);

    for (const key in this._memory) {
      const handler = GlobalState._deleteHandler[key];
      if (handler === undefined) {
        delete this._memory[key];
      } else {
        handler(this._memory);
      }
    }
  }

  // TODO filter functions
  // TODO sort functions, precompute sorts?
  public spawns(): LoDashExplicitArrayWrapper<SpawnState> {
    return _.chain(this.subject().spawns).values().map(SpawnState.right);
  }

  public creeps(): LoDashExplicitArrayWrapper<CreepState> {
    // return this.sources<SourceState>(F.identity<SourceState>());
    return _.chain(this.subject().creeps).values().map(CreepState.right);
  }

  public eachCreep<T>(f: (creep: CreepState) => T): T[] {
    // creeps are always literal
    return _.map(this.subject().creeps, c => {
      return F.lockAnd( CreepState.right(c), f );
    });
  }

  public rooms(): LoDashExplicitArrayWrapper<RoomState> {
    return _.chain(this.subject().rooms).values().map(RoomState.right);
  }

  public remoteRooms(): LoDashExplicitArrayWrapper<RoomState> {
    return _.chain(this._memory.index.rooms).map(RoomState.vright);
  }

  public eachRoom<T>(f: (room: RoomState) => T): T[] {
    return _.map(this.subject().rooms, (room: Room) => {
      return F.lockAnd( RoomState.right(room), f);
    });
  }

  public eachRemoteRoom<T>(f: (room: RoomState) => T): T[] {
    return _.map(this._memory.index.rooms, (id: string) => {
      return F.lockAnd( RoomState.vright(id), f);
    });
  }

  public sources(): LoDashExplicitArrayWrapper<SourceState> {
    // return this.sources<SourceState>(F.identity<SourceState>());
    return _.chain(this._memory.index.sources).map(SourceState.vright);
  }

  public eachSource<T>(f: (room: SourceState) => T): T[] {
    return _.map(this._memory.index.sources, (id: string) => {
      return F.lockAnd( SourceState.vright(id), f);
    });
  }

  public minerals(): MineralState[] {
    // return this.minerals<MineralState>(F.identity<MineralState>());
    return _.values(this._memory.index.minerals).map(MineralState.vright);
  }

  public eachMineral<T>(f: (room: MineralState) => T): T[] {
    return _.map(this._memory.index.minerals, (id: string) => {
      return f(MineralState.vright(id));
    });
  }

  protected _accessAddress() {
    return [];
  }

  protected _indexAddress() {
    return undefined;
  }

  protected _getId(subject: Game) {
    subject = subject;

    return undefined;
  }

  protected init(rootMemory: any): boolean {
    if (this._memory.reset) {
      this.delete();
    }

    if (super.init(rootMemory)) {
      if (!this.isRemote()) {
        // rooms
        _.values(this.subject().rooms).forEach(RoomState.left);
      }

      return true;
    }

    return false;
  }

  protected _resolve(id: string): Game {
    if (id === "game") {
      return Game;
    }

    throw "unresolvable:" + id;
  }
}
