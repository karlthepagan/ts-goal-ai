import * as Filters from "./filters";

export const tasks: Task[] = [];

export function findOpenPositions(pos: RoomPosition, range: number): string[] {
  return (Game.rooms[pos.roomName].lookForAtArea(
    LOOK_TERRAIN, pos.y - range, pos.x - range, pos.y + range, pos.x + range, true) as LookAtResultWithPos[])
    .filter(Filters.isMovable)
    .map(Filters.posAsStr);
}

export function strToRoomPosition(memoized: string[], roomName: string): RoomPosition[] {
  if (memoized === undefined) {
    return []; // TODO remove
  }
  return memoized.map((s) => Filters.strAsPos(s, roomName));
}

export function isSpawnFull(x: Spawn, percent: number): boolean {
  return x.energy >= (x.energyCapacity * percent);
}

export function isEnergyFull(x: Creep, percent: number): boolean {
  const v = x.carry.energy >= (x.carryCapacity * percent);
  return v;
}

export function isTired(x: Creep) {
  return x.fatigue > 0;
}

export function isReady(x: Creep) {
  return x.fatigue === 0;
}
