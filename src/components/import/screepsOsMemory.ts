import BotMemoryDescription from "./botMemoryDescription";
import {CreepDescription} from "./botMemoryDescription";

export default class ScreepsOsMemory implements BotMemoryDescription {
  public getRoomCostmatrix(roomName: string): CostMatrix|any {
    roomName = roomName;
    return undefined;
  }

  public detect(): boolean {
    const mem = Memory as any;
    return mem.processTable && mem.processMemory;
  }

  public describeCreep(creep: Creep): CreepDescription {
    creep = creep;
    return "";
  }
}
