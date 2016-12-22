import * as Debug from "../util/debug";
import * as F from "../functions";
import XYIterator from "../util/xyIterator";
import PositionIterable from "../util/positionIterable";

interface CachedObject {
  id: string;
  type: string;
}

interface CachedObjectPos extends CachedObject {
  range: number;
  pos: RoomPosition;
}

interface CachedLocationMatrix {
  [coord: number]: CachedLocationMatrix | CachedObjectPos;
}

function createObjNormal(obj: any, type: {type: string, range: number}) {
  return _.create(type, {
    pos: {
      x: obj.pos.x,
      y: obj.pos.y,
      roomName: obj.pos.roomName,
    },
    id: obj.id,
  }) as CachedObjectPos;
}

export function createObjSim(obj: any, type: {type: string, range: number}) {
  // PANIC! simulator!
  return {
    id: obj.id,
    type: type.type,
    range: type.range,
    pos: obj.pos,
  } as CachedObjectPos;
}

function exclude(objs: CachedObjectPos[], excluded?: F.XY[]) {
  if (!excluded) {
    return objs;
  }

  return _.chain(objs).reject(function(o) {
    for (let i = excluded.length - 1; i >= 0; i--) {
      if (excluded[i].x === o.pos.x && excluded[i].y === o.pos.y) {
        return true;
      }
    }
    return false;
  }).value();
}

// simulator monkeypatch!
const createObj = Game.cpu.limit === undefined ? createObjSim : createObjNormal;

export default class GraphManager {
  private static TYPES = _.chain(CONSTRUCTION_COST).keys()
    .concat(STRUCTURE_PORTAL, STRUCTURE_CONTROLLER, STRUCTURE_POWER_BANK, LOOK_SOURCES, LOOK_MINERALS)
    .map(s => [s, {type: s, range: 1}]).zipObject().value() as { [type: string]: CachedObjectPos };
  // these are all TYPES, so they have range: 1
  private _targetCache: { [roomName: string]: CachedObjectPos[]} = {};
  private _positionCache: { [roomName: string]: CachedLocationMatrix} = {};

  // TODO find exits and cache distances / directions to items, probably save this in memory
  // private _structureExitRange

  public findWalkable(pos: RoomPosition) {
    if (Game.map.getTerrainAt(pos) !== "wall") {
      return pos;
    }
    for (const p of new PositionIterable(pos, 1, 1)) {
      if (Game.map.getTerrainAt(p) !== "wall") {
        return p;
      }
    }
    return undefined;
  }

  public findNeighbor(pos: RoomPosition, excluded?: F.XY[]) {
    PathFinder.use(true);
    Debug.always("find neighbor");
    const target = this.findWalkable(pos);
    if (!target) {
      return undefined;
    }
    if (excluded) {
      excluded = excluded.concat(pos);
    } else {
      excluded = [pos];
    }
    const cached = this.getObjectsInRoom(target.roomName, excluded);
    const ret = PathFinder.search(target, cached as any) as any; // , { algorithm: "dijkstra"} as any) as any;
    if (ret.incomplete || ret.path.length === 0) {
      return undefined;
    }
    return this.getObject(ret.path[ret.path.length - 1]);
  }

  public getObject(pos: RoomPosition) {
    const room = this._positionCache[pos.roomName];
    const y = room ? room[pos.y] as CachedLocationMatrix : undefined;
    const obj = y ? y[pos.x] as CachedObjectPos : undefined;
    return !obj ? undefined : _.create(obj, {pos: pos}) as CachedObjectPos;
  }

  protected addObject(obj: CachedObjectPos) {
    const iter = new XYIterator(obj.pos, 1);
    const minY = obj.pos.y - 1;
    let p = iter.next();
    while (p.value.y >= minY) {
      const y = F.expand([obj.pos.roomName, p.value.y], this._positionCache);
      y[p.value.x] = obj;
      p = iter.next();
    }
  }

  protected getObjectsInRoom(name: string, excluded?: F.XY[]): CachedObject[]|undefined {
    if (this._targetCache[name]) {
      return exclude(this._targetCache[name], excluded);
    }

    const room: Room = Game.rooms[name];

    if (!room) {
      return undefined;
    }

    const cache = this._targetCache[name] = [] as CachedObjectPos[];

    /*
    my structures but not extractor, observer, rampart
    other structures but not keeper lair, road, wall
    sources
    minerals
     */
    const structs = room.find(FIND_STRUCTURES, {
        filter: function isFlow(s: any) {
          return (s.my && !(s.structureType === STRUCTURE_EXTRACTOR || s.structureType === STRUCTURE_OBSERVER || s.structureType === STRUCTURE_RAMPART))
            || (!s.my && !(s.structureType === STRUCTURE_KEEPER_LAIR || s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_WALL));
        },
      }) as Structure[];
    for (let i = structs.length - 1; i >= 0; i--) {
      const obj = createObj(structs[i], GraphManager.TYPES[structs[i].structureType]);
      cache.push(obj);
      this.addObject(obj);
    }

    const sources = room.find(FIND_SOURCES) as Source[];
    const sourceType = GraphManager.TYPES[LOOK_SOURCES];
    for (let i = sources.length - 1; i >= 0; i--) {
      const obj = createObj(sources[i], sourceType);
      cache.push(obj);
      this.addObject(obj);
    }

    const minerals = room.find(FIND_MINERALS) as Mineral[];
    const mineralType = GraphManager.TYPES[LOOK_MINERALS];
    for (let i = minerals.length - 1; i >= 0; i--) {
      const obj = createObj(minerals[i], mineralType);
      cache.push(obj);
      this.addObject(obj);
    }

    return exclude(cache, excluded);
  }
}
/*
 building cardinal direction max-flow graph principal: the nearest cartesian distance object which is not further via game distance (if there's not a wall wider than the distance)
 */
