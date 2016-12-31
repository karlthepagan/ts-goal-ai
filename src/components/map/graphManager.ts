import * as Debug from "../util/debug";
import * as F from "../functions";
import XYIterator from "../util/xyIterator";
import PositionIterable from "../util/positionIterable";
import {MapMatrices} from "./mapManager";
import {maps} from "../singletons";
import {CachedObjectPos, default as State} from "../state/abstractState";

interface CachedLocationMatrix {
  [coord: number]: CachedLocationMatrix | CachedObjectPos[];
}

function dirMerge(pos: RoomPosition, posRoomXY: F.XY, excluded: {pos: RoomPosition}[]|undefined,
                  directions: CachedObjectPos[][], candidates: CachedObjectPos[], maxPerDir?: number,
                  maxDistance?: number) {

  for (let i = candidates.length - 1; i >= 0; i--) {
    let maxRange = maxDistance;
    const c = candidates[i];
    if (excluded && _.any(excluded, function(e) { return F.xyEq(c.pos, e.pos); })) {
      continue;
    }

    const xy = F.relativeToRoom(pos, posRoomXY, c.pos);

    if (pos.getRangeTo(xy) > maxRange) {
      continue;
    }

    const cDir = F.cardinalDirTo(pos, xy);

    const dirBucket = directions[cDir];

    const insertAt = _.sortedIndex(dirBucket, {pos: xy} as any, function (d) {
      return pos.getRangeTo(d);
    });

    if (maxPerDir <= dirBucket.length) {
      Debug.always("observe maxdir merge");
      if (insertAt < maxPerDir) {
        dirBucket.pop();
        dirBucket.splice(insertAt, 0, c);
      }
    } else {
      dirBucket.splice(insertAt, 0, c);
    }
  }
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

  public findNeighbor(pos: RoomPosition, excluded?: {pos: RoomPosition}[]): CachedObjectPos|undefined {
    PathFinder.use(true);
    const target = this.findWalkable(pos);
    if (!target) {
      return undefined;
    }
    if (!excluded) {
      excluded = [{pos: pos}];
    }
    const dirs = _.compact(this.getNearbyObjects(pos, 4, 100, excluded));
    const cached = _.flatten(dirs);
    // const cached = this.getObjectsInRoom(target.roomName, excluded);
    return this.search(target, cached);
  }

  public search(walkable: RoomPosition, goals: {pos: RoomPosition, range: number}[], dijkstra?: boolean): CachedObjectPos|undefined {
    if (goals.length === 0) {
      return undefined;
    }
    if (!this._targetCache[walkable.roomName]) {
      Debug.error("targetCache not ready for roomName=" + walkable.roomName);
      return undefined;
    }
    const ret = PathFinder.search(walkable, goals, {
      roomCallback: cacheTerrainMatrix,
      maxRooms: 4,
      algorithm: dijkstra ? "dijkstra" : undefined,
    } as any) as any;
    if (ret.incomplete) {
      return undefined;
    }
    let obj: CachedObjectPos | undefined;
    if (ret.cost === 0) {
      // special case - neighbor
      obj = this.getObject(walkable, false, goals);
      if (!obj) {
        Debug.error("neighbor failed");
        return undefined;
      }
      obj.range = 0;
      return obj;
    // } else if (ret.cost < 3) {
    //   // TODO later find neighbor with touching cases?
    }
    obj = this.getObject(ret.path[ret.path.length - 1], false, goals);
    if (!obj) {
      Debug.error("pathfind failed?");
      return undefined;
    }
    obj.range = ret.cost;
    return obj;
  }

  public getObject(pos: RoomPosition, mergePos?: boolean, goals?: {pos: RoomPosition}[]) {
    const room = this._positionCache[pos.roomName];
    const y = room ? room[pos.y] as CachedLocationMatrix : undefined;
    const objs = y ? y[pos.x] as CachedObjectPos[] : undefined;
    if (!objs) {
      return undefined;
    }
    let obj: CachedObjectPos|undefined;
    if (objs.length === 1) {
      obj = objs[0];
    } else if (goals) {
      // TODO NOW conflict resolution
      obj = F.posIntersect(objs, goals);
      if (!obj) {
        throw Debug.throwing(new Error("position conflict resolution failed"));
      }
    } else {
      throw Debug.throwing(new Error("goals require conflict resolution"));
    }
    const dir = obj ? F.posToDirection(obj.pos, pos) : undefined;
    return !obj ? undefined : _.create(obj, mergePos ? {pos, dir} : {dir}) as CachedObjectPos;
  }

  public initRoom(roomName: string) {
    this.getObjectsInRoom(roomName);
  }

  protected addObject(obj: CachedObjectPos) {
    const iter = new XYIterator(obj.pos, 1);
    const minY = obj.pos.y - 1;
    let p = iter.next();
    while (p.value.y >= minY) {
      const pos = F.expand([obj.pos.roomName, p.value.y, p.value.x], this._positionCache, []) as CachedObjectPos[];
      pos.push(obj);
      p = iter.next();
    }
  }

  protected getNearbyObjects(pos: RoomPosition, maxPerDir: number, maxDistance: number, excluded?: {pos: RoomPosition}[]): CachedObjectPos[][]|undefined {
    const posRoomXY = F.parseRoomName(pos.roomName); // TODO assert defined
    const directions = [null, [], null, [], null, [], null, []] as CachedObjectPos[][];

    let candidates = this.getObjectsInRoom(pos.roomName);
    if (!candidates) {
      return undefined;
    }

    dirMerge(pos, posRoomXY, excluded, directions, candidates, maxPerDir, maxDistance);

    for (let dir = 1; dir < 8; dir += 2) {
      if (directions[dir].length >= maxPerDir) {
        continue;
      }
      const addRoomXY = F.dirTransform(Object.create(posRoomXY), dir);
      const addRoom = F.formatRoomName(addRoomXY);
      candidates = this.getObjectsInRoom(addRoom);
      if (!candidates) {
        // TODO later - opening up new rooms should re-evaluate buildings in neighboring rooms
        continue;
      }

      dirMerge(pos, posRoomXY, excluded, directions, candidates, maxPerDir, maxDistance);

      directions[dir].splice(maxPerDir);
    }

    return directions;
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
      const obj = createObj(structs[i], State.TYPES[structs[i].structureType]);
      cache.push(obj);
      this.addObject(obj);
    }

    const sources = room.find(FIND_SOURCES) as Source[];
    const sourceType = State.TYPES[LOOK_SOURCES];
    for (let i = sources.length - 1; i >= 0; i--) {
      const obj = createObj(sources[i], sourceType);
      cache.push(obj);
      this.addObject(obj);
    }

    const minerals = room.find(FIND_MINERALS) as Mineral[];
    const mineralType = State.TYPES[LOOK_MINERALS];
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
