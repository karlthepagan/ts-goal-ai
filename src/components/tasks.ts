import * as Filters from "./filters";
import * as Keys from "./keys";

export const tasks: Task[] = [];
export const NOOP: Task = () => { return 0; };

export function initTerrain(subject: RoomObject, memory: any) {
  const pos: RoomPosition = subject.pos;

  const terrain: LookAtResultWithPos[] = (subject.room.lookForAtArea(
    LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true) as LookAtResultWithPos[])
    .filter(Filters.isMovable);

  console.log(JSON.stringify(terrain));

  memory[Keys.RESOURCE_OUTPUT_POSITIONS] = [];

  terrain.forEach((look: LookAtResultWithPos) => {
    memory[Keys.RESOURCE_OUTPUT_POSITIONS].push( Filters.xyAsStr(look.x, look.y));
  });
}
