import * as Filters from "./filters";
import * as Keys from "./keys";

export const tasks: Task[] = [];
export const NOOP: Task = () => { return 0; };

export function findOpenPositions(pos: RoomPosition, memory: any, range: number) {
  const terrain: LookAtResultWithPos[] = (Game.rooms[pos.roomName].lookForAtArea(
    LOOK_TERRAIN, pos.y - range, pos.x - range, pos.y + range, pos.x + range, true) as LookAtResultWithPos[])
    .filter(Filters.isMovable);

  memory[Keys.OBJECT_WORK_POSITIONS] = _.transform(terrain, (acc: string[], look: LookAtResultWithPos) => {
    acc.push( Filters.xyAsStr(look.x, look.y) );
  }, []);
}
