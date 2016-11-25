// export type GoalLambda<T> = (resource: Plan<T>) => Goal<any, T, State<any>>;
// export type GoalFactory<T> = { [key: string]: GoalLambda<T> };
// export type CandidateLambda<S, T> = (state: S) => T[];
// export type CandidateFactory<T> = { [key: string]: CandidateLambda<T, any> };

// import {log} from "./support/log";
export type Filter<T> = (s: T) => boolean;
export type Task = () => number;
export type Func<X, Y> = (x: X) => Y;
export type Identity<X> = Func<X, X>;
export type XY = {x: number, y: number};

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
  return x === undefined ? y : x;
}

const movable: { [key: string]: Filter<any> } = {
  plain: TRUE as Filter<any>,
  rampart: RAMPART,
  swamp: TRUE as Filter<any>,
};

export function isMovable(lookAt: LookAtResultWithPos): boolean {
  return elvis(movable[lookAt.terrain as string], FALSE as Filter<any>)(lookAt);
}

export function pad(num: any, size: number) {
  return ("000000000" + num).substr(-size);
}

export function xyAsStr(x: number, y: number): string {
  return pad(x, POS_DIGITS) + pad(y, POS_DIGITS);
}

export function rposAsStr(pos?: {x: number, y: number, roomName: string}): string {
  if (pos === undefined) {
    return "";
  }

  return pos.roomName + " " + xyAsStr(pos.x, pos.y);
}

export function posAsStr(pos?: XY): string {
  if (pos === undefined) {
    return "";
  }

  return xyAsStr(pos.x, pos.y);
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

function shallowCopy<U>(obj: U): U {
  const copy = JSON.parse(JSON.stringify(obj));

  Object.setPrototypeOf(copy, Object.getPrototypeOf(obj));

  return copy;
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

// TODO consider options
// http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript#
export function dirToPosition<T extends XY>(origin: T) {
  return ((dir) => {
    const result = dirTransform(shallowCopy(origin), dir);
    // log.debug(origin, "dir", dir, "=", result);
    return result;
  }) as (dir: number) => T;
}

export function room(subject: any): string {
  if (subject.room === undefined) {
    return "";
  }

  return subject.room.name as string;
}

export function strAsPos(serialized: string, room: string): RoomPosition {
  return new RoomPosition(
    +serialized.substring(0, POS_DIGITS),
    +serialized.substring(POS_DIGITS, POS_DIGITS_X_2),
    room);
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
