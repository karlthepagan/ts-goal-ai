import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";

export default class GlobalState extends State<Game> {
  public static boot() {
    return GlobalState._game = new GlobalState().wrap(Game, botMemory()) as GlobalState;
  }

  public static game() {
    return GlobalState._game;
  }

  private static _game: GlobalState;

  public toString() {
    return "[GlobalState]";
  }

  protected _getId(game: Game) {
    game = game;

    return "Game";
  }

  protected _access(memory: any): any {
    if (memory.global === undefined) {
      memory.global = {};
    }
    return memory.global;
  }

  protected init(): boolean {
    if (!super.init()) {
      return false;
    }

    return true;
  }

  protected delete() {
    log.debug("delete", this);
  }
}
