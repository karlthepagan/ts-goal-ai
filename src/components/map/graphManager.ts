import * as Debug from "../util/debug";
import * as F from "../functions";
import XYIterator from "../util/xyIterator";
import PositionIterable from "../util/positionIterable";
import {MapMatrices} from "./mapManager";
import {maps} from "../singletons";

export interface CachedObject {
  id: string;
  type: string;
}

export interface CachedObjectPos extends CachedObject {
  range: number;
  pos: RoomPosition;
  cost?: number;
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

export function exclude(objs: CachedObjectPos[], excluded?: F.XY[]) {
  if (!excluded) {
    return objs;
  }

  return _.chain(objs).reject(function(o) {
    return _.any(excluded, function(e) {
      return F.xyEq(e, o.pos);
    });
  }).value();
}

// simulator monkeypatch!
const createObj = Game.cpu.limit === undefined ? createObjSim : createObjNormal;

const terrainCache: MapMatrices = {};

export function cacheTerrainMatrix(roomName: string) {
  if (terrainCache[roomName]) {
    return terrainCache[roomName];
  }

  return terrainCache[roomName] = maps.init(roomName) as CostMatrix;
}

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

  public findNeighbor(pos: RoomPosition, excluded?: RoomPosition[]) {
    PathFinder.use(true);
    const target = this.findWalkable(pos);
    if (!target) {
      return undefined;
    }
    if (excluded) {
      excluded = excluded.concat(pos);
    } else {
      excluded = [pos];
    }
    const cached = this.getNearbyObjects(pos, excluded);
    // const cached = this.getObjectsInRoom(target.roomName, excluded);
    const ret = PathFinder.search(target, cached as any, {
      roomCallback: cacheTerrainMatrix,
      maxRooms: 4,
      algorithm: "dijkstra",
    } as any) as any;
    if (ret.incomplete) {
      return undefined;
    }
    let obj: CachedObjectPos | undefined;
    if (ret.cost === 0) {
      // special case - neighbor
      obj = this.getObject(target);
      if (!obj) {
        Debug.error("neighbor failed");
        return undefined;
      }
      obj.cost = 0;
      return obj;
    // } else if (ret.cost < 3) {
    //   // TODO later find neighbor with touching cases?
    }
    obj = this.getObject(ret.path[ret.path.length - 1]);
    if (!obj) {
      Debug.error("pathfind failed?");
      return undefined;
    }
    obj.cost = ret.cost;
    return obj;
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

  protected getNearbyObjects(pos: RoomPosition, maxPerDir: number, excluded?: RoomPosition[]): CachedObjectPos[]|undefined {
    const posRoomXY = F.parseRoomName(pos.roomName);
    const result: CachedObjectPos[] = [];
    const directions = [[], [], [], []] as { [dir: number]: CachedObjectPos[]};

    let candidates = this.getObjectsInRoom(pos.roomName);
    if (!candidates) {
      return undefined;
    }
    for (let dir = 0; dir < 8; dir++) {
      for (let i = candidates.length - 1; i >= 0; i--) {
        const c = candidates[i];
        if (excluded && _.any(excluded, function(e) { return F.xyEq(c.pos, e); })) {
          continue;
        }

        const xy = F.relativeToRoom(pos, posRoomXY, c.pos);

        const cDir = F.cardinalDirTo(pos, xy);

        const dirBucket = directions[cDir];

        const insertAt = _.sortedIndex(dirBucket, {pos: xy} as any, function (d) {
          return pos.getRangeTo(d);
        });
      }
    }
  }

  protected getObjectsInRoom(name: string): CachedObjectPos[]|undefined {
    if (this._targetCache[name]) {
      return this._targetCache[name];
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

    return cache;
  }
}
/*
 building cardinal direction max-flow graph principal: the nearest cartesian distance object which is not further via game distance (if there's not a wall wider than the distance)
 */
