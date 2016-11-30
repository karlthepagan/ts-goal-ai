export type CreepDescription = string;

interface BotMemoryDescription {
  getRoomCostmatrix(roomName: string): CostMatrix|undefined;
  detect(): boolean;
  describeCreep(creep: Creep): CreepDescription;
}

export default BotMemoryDescription;
