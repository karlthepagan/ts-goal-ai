import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
import RoomState from "./roomState";
import SpawnState from "./spawnState";
import SourceState from "./sourceState";
import MineralState from "./mineralState";
import CreepState from "./creepState";
// import * as F from "../functions";

export default class GlobalState extends State<Game> {
  public static boot() {
    return GlobalState._game = new GlobalState("GlobalState").wrap(Game, botMemory()) as GlobalState;
  }

  public static game() {
    return GlobalState._game;
  }

  protected static _survivesDelete: string[] = [];

  private static _game: GlobalState;

  protected _accessAddress = [];
  protected _indexAddress = undefined;

  public delete() {
    super.delete();

    log.debug("deleting", this);

    for (const key in this._memory) {
      if (GlobalState._survivesDelete.indexOf(key) < 0) {
        delete this._memory[key];
      }
    }
  }

  public spawns(): SpawnState[] {
    return _.values<Spawn>(this.subject().spawns).map(SpawnState.right);
  }

  // TODO filter functions
  // TODO sort functions, precompute sorts?
  public eachSpawn<T>(f: (spawn: SpawnState) => T): T[] {
    // TODO lodash functional pipelines
    // spawns are always literal
    return _.map(this.subject().spawns, (s) => {
      return f( SpawnState.right(s) );
    });
  }

  public creeps(): CreepState[] {
    return _.values<Creep>(this.subject().creeps).map(CreepState.right);
  }

  public eachCreep<T>(f: (creep: CreepState) => T): T[] {
    // creeps are always literal
    return _.map(this.subject().creeps, (c) => {
      return f( CreepState.right(c) );
    });
  }

  public rooms(): RoomState[] {
    // return this.rooms<RoomState>(F.identity<RoomState>());
    return _.values(this._memory.index.rooms).map(RoomState.vright);
  }

  public eachRoom<T>(f: (room: RoomState) => T): T[] {
    return _.map(this._memory.index.rooms, (id: string) => {
      return f(RoomState.vright(id));
    });
  }

  public sources(): SourceState[] {
    // return this.sources<SourceState>(F.identity<SourceState>());
    return _.values(this._memory.index.sources).map(SourceState.vright);
  }

  public eachSource<T>(f: (room: SourceState) => T): T[] {
    return _.map(this._memory.index.sources, (id: string) => {
      return f(SourceState.vright(id));
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

  public rescore(value?: number): number {

    /* TODO game score is
       - add sum of all RCL * RCL weight
       - add sum of each room's energy velocity * venergy weight
       - add sum of all scored minerals * each minieral type weight
       - add sum of each secured mineral * each mineral type access weight (secured: military minimum score)
       - add sum of each room's military score minus sum of neighbor military score * military weight
       -- military score influenced by player military weight
     */
    if (value === undefined) {
      value = 0;

      // TODO iterate (last score order) thru non-virtual rooms => creeps, buildings
    }
    return this._memory.score = value;
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
      if (!this.isVirtual()) {
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
