import BotMemoryDescription from "./botMemoryDescription";
import {CreepDescription} from "./botMemoryDescription";

export const ROLES = [
  "sourcer",
  "harvester",
  "repairer",
  "storagefiller",
  "builder",
  "carry",
  "defendemelee",
  "builder",
  "planer",
  "nextroomer",
  "worldplanner",
  "atkeepermelee",
  "resourcecleaner",
  "energytransporter",
  "powerattacker",
  "squadsiege",
];

export default class TooAngelMemory implements BotMemoryDescription {
  constructor() {
    this.getRoomCostmatrix = _.memoize(this.getRoomCostmatrix as any);
  }

  public getRoomCostmatrix(roomName: string): CostMatrix|undefined {
    const room = Game.rooms[roomName];
    if (room === undefined || room === null) { // TODO Memory instead of instance
      return undefined;
    }

    return PathFinder.CostMatrix.deserialize(room.memory.costMatrix.base);
  }

  public detect(): boolean {
    const mem = Memory as any;
    if (!Array.isArray(mem.myRooms)) {
      return false;
    }

    for (let r of mem.myRooms) {
      if (typeof r !== "string") {
        return false;
      }
      break;
    }

    if (typeof mem.username !== "string") {
      return false;
    }

    return true;
    // TODO creep role detection?
    // return _.chain(Game.creeps).values()
    //     .filter((c: Creep) => c.memory.role === "sourcer" || c.mem)
    //     .first().valueOf() !== undefined;
  }

  public describeCreep(creep: Creep): CreepDescription {
    return creep.memory.role;
  }
}
