import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
import RoomState from "./roomState";
import SourceState from "./sourceState";
import MineralState from "./mineralState";
import CreepState from "./creepState";
import * as F from "../functions";
import LoDashExplicitArrayWrapper = _.LoDashExplicitArrayWrapper;
import StructureState from "./structureState";
import FlagState from "./flagState";
import ConstructionState from "./constructionState";

export default class GlobalState extends State<Game> {
  public static readonly CHANGED_FLAGS = "flags";
  public static readonly CHANGED_CREEPS = "creeps";
  public static readonly CHANGED_SITES = "constructionSites";
  public static readonly CHANGED_STRUCTURES = "structures";

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
  public spawns(): LoDashExplicitArrayWrapper<StructureState<Spawn>> {
    return _.chain(this.subject().spawns).values().map(StructureState.right);
  }

  public creeps(): LoDashExplicitArrayWrapper<CreepState> {
    // TODO F.lockAnd ?
    return _.chain(this.subject().creeps).values().map(CreepState.right);
  }

  /**
   * reaper procedure - iterates thru creeps we think are alive
   */
  public bodies(): LoDashExplicitArrayWrapper<CreepState> {
    return _.chain(this._memory.index.creeps).values().map(CreepState.vright);
  }

  public rooms(): LoDashExplicitArrayWrapper<RoomState> {
    // TODO add init callback to .right?
    return _.chain(this.subject().rooms).values().map(RoomState.right);
  }

  public remoteRooms(): LoDashExplicitArrayWrapper<RoomState> {
    return _.chain(this._memory.index.rooms).map(RoomState.vright);
  }

  public sources(): LoDashExplicitArrayWrapper<SourceState> {
    // return this.sources<SourceState>(F.identity<SourceState>());
    return _.chain(this._memory.index.sources).map(SourceState.vright);
  }

  public minerals(): MineralState[] {
    // return this.minerals<MineralState>(F.identity<MineralState>());
    return _.values(this._memory.index.minerals).map(MineralState.vright);
  }

  public getChanges(): string[] {
    return [GlobalState.CHANGED_CREEPS,
      GlobalState.CHANGED_FLAGS,
      GlobalState.CHANGED_SITES,
      GlobalState.CHANGED_STRUCTURES].filter(n => this.isChanged(n));
  }

  public isChanged(type: string) {
    return _.size((Game as any)[type]) !== _.size(this._memory[type]);
  }

  public flags(): LoDashExplicitArrayWrapper<FlagState> {
    return _.chain(this.subject().flags).values().map(FlagState.right);
  }

  public sites(): LoDashExplicitArrayWrapper<ConstructionState> {
    return _.chain(this.subject().constructionSites).values().map(ConstructionState.right);
  }

  public structures(): LoDashExplicitArrayWrapper<StructureState<any>> {
    return _.chain(this.subject().structures).values().map(StructureState.right);
  }

  /**
   * reaper procedure - iterates thru structures which we think are alive
   */
  public ruins(): LoDashExplicitArrayWrapper<StructureState<any>> {
    return _.chain(this._memory.index.structures).values().map(StructureState.vright);
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

  protected init(rootMemory: any, callback?: LifecycleCallback<GlobalState>): boolean {
    if (this._memory.reset) {
      this.delete();
    }

    if (super.init(rootMemory, callback)) {
      if (!this.isRemote()) {
        // rooms
        this.rooms().value();
      }

      if (callback !== undefined) {
        callback(this, State.LIFECYCLE_NEW);
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
