import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
import RoomState from "./roomState";
import SpawnState from "./spawnState";
import SourceState from "./sourceState";
import MineralState from "./mineralState";

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

  // TODO filter functions
  public spawns(f: (spawn: SpawnState) => void) {
    for (const id of this._memory.index.spawns) {
      f(SpawnState.vright(id));
    }
  }

  public rooms(f: (room: RoomState) => void) {
    for (const id of this._memory.index.rooms) {
      f(RoomState.vright(id));
    }
  }

  public sources(f: (room: SourceState) => void) {
    for (const id of this._memory.index.sources) {
      f(SourceState.vright(id));
    }
  }

  public minerals(f: (room: MineralState) => void) {
    for (const id of this._memory.index.minerals) {
      f(MineralState.vright(id));
    }
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
