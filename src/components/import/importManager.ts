import BotMemoryDescription from "./botMemoryDescription";
export default class ImportManager {
  private _handlers: { [key: string]: BotMemoryDescription } = {};

  public addMemoryDescription(botName: string, handler: BotMemoryDescription) {
    this._handlers[botName] = handler;
  }

  public detect(): string[] {
    return _.chain(this._handlers).pick((v: BotMemoryDescription) => v.detect()).keys().value();
  }
}
