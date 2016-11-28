import BotMemoryDescription from "./botMemoryDescription";
import {log} from "../support/log";
import GlobalState from "../state/globalState";
export default class ImportManager {
  private _handlers: { [key: string]: BotMemoryDescription } = {};

  public addMemoryDescription(botName: string, handler: BotMemoryDescription) {
    this._handlers[botName] = handler;
  }

  public importData(botName: string, rootMemory: any, state: GlobalState) {
    rootMemory = rootMemory;
    state = state;

    log.info("importing", botName);
  }

}
