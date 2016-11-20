import State from "./abstractState";
import * as Filters from "../filters";
import * as Keys from "../keys";

abstract class ResourceState<T extends RoomObject> extends State<T> {
  protected initTerrain() {
    const pos: RoomPosition = this.subject.pos;

    const terrain: LookAtResultWithPos[] = (this.subject.room.lookForAtArea(
      LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true) as LookAtResultWithPos[])
      .filter(Filters.isMovable);

    console.log(JSON.stringify(terrain));

    this.memory[Keys.RESOURCE_OUTPUT_POSITIONS] = [];

    terrain.forEach((look: LookAtResultWithPos) => {
      this.memory[Keys.RESOURCE_OUTPUT_POSITIONS].push( Filters.xyAsStr(look.x, look.y));
    });
  }
}
export default ResourceState;
