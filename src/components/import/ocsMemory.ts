import BotMemoryDescription from "./botMemoryDescription";
import {CreepDescription} from "./botMemoryDescription";

export default class OcsMemory implements BotMemoryDescription {
  public getRoomCostmatrix(roomName: string): CostMatrix|undefined {
    const mem = Memory as any;
    const room = mem.pathfinder[roomName];
    if (!(room && room.costMatrix)) {
      return undefined;
    }

    return PathFinder.CostMatrix.deserialize(room.costMatrix);
  }

  public detect(): boolean {
    const mem = Memory as any;
    return mem.modules && mem.modules.viral && mem.modules.internalViral
      && mem.pathfinder && mem.population;
  }

  public describeCreep(creep: Creep): CreepDescription {
    const mem = Memory as any;
    const creepMem = mem.population[creep.name];
    if (!creepMem) {
      return "";
    }
    return creepMem.creepType;
  }
}
