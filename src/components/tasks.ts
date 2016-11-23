import * as Filters from "./filters";

export const tasks: Task[] = [];

export function findOpenPositions(pos: RoomPosition, range: number) {
  return (Game.rooms[pos.roomName].lookForAtArea(
    LOOK_TERRAIN, pos.y - range, pos.x - range, pos.y + range, pos.x + range, true) as LookAtResultWithPos[])
    .filter(Filters.isMovable)
    .map(Filters.posAsStr);
}
