import BotMemoryDescription from "./botMemoryDescription";
import {CreepDescription} from "./botMemoryDescription";

export default class ScreepsOsMemory implements BotMemoryDescription {
  public getRoomCostmatrix(roomName: string): CostMatrix|any {
    return undefined;
  }

  public detect(): boolean {
    return undefined; // TODO processTable, processMemory
  }

  public describeCreep(creep: Creep): CreepDescription {
    return undefined;
  }
}
