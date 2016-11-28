interface BotMemoryDescription {
  getRoomCostmatrix(roomName: string): CostMatrix|undefined;
  detect(): boolean;
}

export default BotMemoryDescription;
