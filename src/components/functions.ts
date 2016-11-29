import {log} from "./support/log";
import State from "./state/abstractState";

// export type GoalLambda<T> = (resource: Plan<T>) => Goal<any, T, State<any>>;
// export type GoalFactory<T> = { [key: string]: GoalLambda<T> };
// export type CandidateLambda<S, T> = (state: S) => T[];
// export type CandidateFactory<T> = { [key: string]: CandidateLambda<T, any> };

export type Filter<T> = (s: T) => boolean;
export type Task = () => number;
export type Func<X, Y> = (x: X) => Y;
export type Identity<X> = Func<X, X>;
export type XY = {x: number, y: number};

const ROOM_PATTERN = /([EW])(\d+)([NS])(\d+)/;

export const NOOP_SCRPS: Task = () => { return 0; };
export const NOOP: () => any = () => { return undefined; };
export const IDENTITY: Identity<any> = (a) => { return a; };

export function identity<T>(): Func<T, T> {
  return IDENTITY;
}

const POS_DIGITS = 2;
const POS_DIGITS_X_2 = POS_DIGITS * 2;

export function findOpenPositions(room: Room, pos: RoomPosition, range: number): XY[] {
  return (room.lookForAtArea(
    LOOK_TERRAIN, pos.y - range, pos.x - range, pos.y + range, pos.x + range, true) as LookAtResultWithPos[])
    .filter(isMovable) as XY[];
}

export function strToRoomPosition(memoized: string[], roomName: string): RoomPosition[] {
  if (memoized === undefined) {
    return []; // TODO remove
  }
  return memoized.map((s) => strAsPos(s, roomName));
}

function TRUE() {
  return true;
}

function FALSE() {
  return false;
}

function RAMPART(s: any): boolean {
  return s.my;
}

export function elvis<T>(x: T|undefined, y: T): T {
  return x === undefined || x === null ? y : x;
}

export function elvisLazy<T>(x: T|undefined, y: T|(() => T)): T {
  if (typeof y === "function") {
    return x === undefined || x === null ? y() : x;
  }
  return x === undefined || x === null ? y : x;
}

const movable: { [key: string]: Filter<any> } = {
  plain: TRUE as Filter<any>,
  rampart: RAMPART,
  swamp: TRUE as Filter<any>,
};

export function isMovable(lookAt: LookAtResultWithPos): boolean {
  return elvis(movable[lookAt.terrain as string], FALSE as Filter<any>)(lookAt);
}

export function pad(num: number, size: number) {
  if (num === undefined || num === null) {
    throw new Error(num + "");
  }
  return ("000000000" + num).substr(-size);
}

export function xyAsStr(x: number, y: number): string {
  return pad(x, POS_DIGITS) + pad(y, POS_DIGITS);
}

export function rposAsStr(pos?: {x: number, y: number, roomName: string}): string {
  if (pos === undefined || pos.x === undefined || pos.y === undefined) {
    throw new Error("no pos");
  }

  return pos.roomName + " " + xyAsStr(pos.x, pos.y);
}

export function posAsStr(pos?: XY): string {
  if (pos === undefined || pos.x === undefined || pos.y === undefined) {
    debugger;
    throw new Error("no pos");
  }

  return xyAsStr(pos.x, pos.y);
}

export function strAsPos(serialized: string, room: string): RoomPosition {
  if (serialized === "" || serialized === undefined) {
    throw new Error("no pos");
  }

  return new RoomPosition(
    +serialized.substring(0, POS_DIGITS),
    +serialized.substring(POS_DIGITS, POS_DIGITS_X_2),
    room);
}

const posToDirMap: number[][] = [
  [ TOP_LEFT,     TOP,    TOP_RIGHT ], // y, x
  [ LEFT,         0,      RIGHT ],
  [ BOTTOM_LEFT,  BOTTOM, BOTTOM_RIGHT],
];

export function posToDirection(origin: XY): (dst: XY) => number {
  return (dst) => {
    const dirRow = elvis(posToDirMap[1 + dst.y - origin.y], [] as number[]);
    return dirRow[1 + dst.x - origin.x];
  };
}

export function dirTransform<D extends XY>(origin: D, dir: number): D {
  switch (dir) {
    case TOP_RIGHT:
          origin.x++;
    case TOP:
          origin.y--;
          break;

    case BOTTOM_RIGHT:
          origin.y++;
    case RIGHT:
          origin.x++;
          break;

    case BOTTOM_LEFT:
          origin.x--;
    case BOTTOM:
          origin.y++;
          break;

    case TOP_LEFT:
          origin.y--;
    case LEFT:
          origin.x--;
          break;

    default:
  }

  return origin;
}

// TODO consider options for clone
// http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript#
export function dirToPosition(origin: RoomPosition) {
  debugger;
  return (dir: number) => {
    debugger;
    const result = new RoomPosition(origin.x, origin.y, origin.roomName);
    // log.debug(origin, "dir", dir, "=", result);
    return dirTransform( result, dir);
  };
}

export function room(subject: any): string {
  if (subject.room === undefined) {
    return "";
  }

  return subject.room.name as string;
}

export function isSource(x: any) {
  return x.ticksToRegeneration !== undefined && x.mineralType === undefined;
}

export function buildFollow(mem: any, addr: string, value: any): any {
  if (mem[addr] === undefined) {
    return mem[addr] = value;
  } else {
    return mem[addr];
  }
}

export function deleteExpand(address: string[], memory: any, array?: boolean): boolean {
  if (address.length === 0) {
    return false;
  }

  let last = address.length - 1;

  for (let i = 0; i < last; i++) {
    memory = buildFollow(memory, address[i], {});
  }

  const key = address[last];
  if (array) {
    const list: string[] = memory[last];
    const i = list.indexOf(key);
    if (i >= 0) {
      list.splice(i, 1);
    }
    return true;
  }
  return delete memory[address[last]];
}

export function expand(address: string[], memory: any, array?: boolean): any {
  if (address.length === 0) {
    return memory;
  }

  let last = address.length - 1;

  for (let i = 0; i < last; i++) {
    memory = buildFollow(memory, address[i], {});
  }

  return buildFollow(memory, address[last], array ? [] : {});
}

export function parseRoomName(roomName: string): XY {
  const match = ROOM_PATTERN.exec(roomName);
  if (match === null) {
    throw new Error(roomName);
  }
  const x = match[1] === "W" ? (-1 - +match[2]) : (+match[2]);
  const y = match[3] === "N" ? (-1 - +match[4]) : (+match[4]);

  return {x, y};
}

export function formatRoomName(pos: XY): string {
  if (pos.x < 0) {
    if (pos.y < 0) {
      return "W" + -(pos.x + 1) + "N" + -(pos.y + 1);
    } else {
      return "W" + -(pos.x + 1) + "S" + pos.y;
    }
  } else {
    if (pos.y < 0) {
      return "E" + pos.x + "N" + -(pos.y + 1);
    } else {
      return "E" + pos.x + "S" + pos.y;
    }
  }
}

export function rangeScore(a: RoomPosition, b: RoomPosition) {
  const range = a.getRangeTo(b);

  // TODO minimum score range, translate to pathing?
  return Math.floor( Math.log2(range + 1) );
}

export function byRangeScore(pos: RoomPosition) {
  return (s: { pos: RoomPosition} ) => rangeScore(s.pos, pos);
}

// TODO reconcile these 2 flavors
export function byRangeTo(pos: RoomPosition) {
  return (s: { pos: RoomPosition} ) => {
    const range = pos.getRangeTo(s.pos);
    if (range === null || isNaN(range)) {
      log.error("no pos on", s);
      throw new Error(range + "");
    }
    return range;
  };
}

export function byStateRangeTo(pos: RoomPosition) {
  return (s: { pos: () => RoomPosition} ) => {
    const range = pos.getRangeTo(s.pos());
    if (range === null || isNaN(range)) {
      log.error("no pos() on", s);
      throw new Error(range + "");
    }
    return range;
  };
}

export function tee(
    main: (a?: any, b?: any, c?: any, d?: any) => any,
    teef: (ret: any, a?: any, b?: any, c?: any, d?: any) => void) {

  return (a?: any, b?: any, c?: any, d?: any) => {
    const ret = main(a, b, c, d);
    teef(ret, a, b, c, d);
    return ret;
  };
}

export function wantsEnergy(s: OwnedStructure|ConstructionSite) {
  switch (s.structureType) {
    case STRUCTURE_CONTROLLER:
    case STRUCTURE_CONTAINER:
    case STRUCTURE_EXTENSION:
    case STRUCTURE_SPAWN:
    case STRUCTURE_STORAGE:
    case STRUCTURE_TOWER:
    case STRUCTURE_LINK:
    case STRUCTURE_TERMINAL:
      // log.debug(s, "wants energy");
      return true;
    default:
      return false;
  }
}

export function lock(s: any): boolean {
  s.lock();
  return true;
}

export function release(s: any): boolean {
  s.release();
  return true;
}

export function lockAnd<T extends State<any>, U>(s: T, f: (s: T) => U) {
  s.lock();
  const result = f(s);
  s.release();
  return result;
}

export function dummy() {
  log.debug("don't warn me about unused imports");
}
/* STASH
 const pos = state.pos();
 const gridIterator = new RoomIterator(pos.roomName);
 let result = gridIterator.next();
 let activeDepth = 0;
 let foundDepth = Infinity;
 let found: { [dist: number]: OwnedStructure } = {};
 let winningScore = Infinity;
 while (!result.done) {
 if (result.value.resolve()) {
 activeDepth = gridIterator.depth();
 if (activeDepth > foundDepth) {
 break;
 }
 const room = result.value.subject();
 const closest = _.chain(room.find<OwnedStructure>(FIND_MY_STRUCTURES, {
 filter: wantsEnergy)
 .groupBy(F.tee(F.byRangeScore(pos), (ret) => { winningScore = Math.min(winningScore, ret); }))
 .filter((v, score) => { return score <= winningScore; })
 .first<OwnedStructure[]>();

 if (closest !== undefined) {
 foundDepth = activeDepth;
 found[] = closest;
 }
 } else if (activeDepth + 1 < gridIterator.depth()) {
 break; // giving up
 }

 result = gridIterator.next();
 }

 found = _.sortBy(found, F.sortByRangeScore(pos));
 */
