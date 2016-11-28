import BotMemoryDescription from "./botMemoryDescription";
import {log} from "../support/log";

export default class TooAngelMemory implements BotMemoryDescription {
  constructor() {
    this.getRoomCostmatrix = _.memoize(this.getRoomCostmatrix as any);
  }

  public getRoomCostmatrix(roomName: string): CostMatrix|undefined {
    const room = Game.rooms[roomName];
    if (room === undefined || room === null) {
      return undefined;
    }

    return PathFinder.CostMatrix.deserialize(room.memory.costMatrix.base);
  }

  public detect(): boolean {
    log.debug("detecting tooAngel");
    return _.chain(Game.creeps).values()
        .filter((c: Creep) => c.memory.role === "sourcer")
        .first().valueOf() !== undefined;
  }
}
