import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
import RoomState from "./roomState";

export default class GlobalState extends State<Game> {
  public static boot() {
    return GlobalState._game = new GlobalState("GlobalState").wrap(Game, botMemory()) as GlobalState;
  }

  public static game() {
    return GlobalState._game;
  }

  private static _game: GlobalState;

  protected _memAddress = [];

  public toString() {
    return "[" + this._name + "]";
  }

  public delete() {
    super.delete();

    delete this._memory.reset;
    delete this._memory.rooms;
    delete this._memory.sources;
    delete this._memory.minerals;

    log.debug("deleted", this);
  }

  protected _getId(subject: Game) {
    subject = subject;

    return "game";
  }

  protected init(): boolean {
    if (this._memory.reset) {
      this.delete();
    }

    if (!super.init()) {
      if (!this.isVirtual()) {
        // rooms
        _.values(this.subject().rooms).forEach(RoomState.left);
      }

      return false;
    }

    return true;
  }

  protected _resolve(id: string): Game {
    if (id === "game") {
      return Game;
    }

    throw "unresolvable:" + id;
  }
}
