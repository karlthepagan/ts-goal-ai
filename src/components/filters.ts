import Goal from "./goals/goal";
import State from "./state/abstractState";
import Plan from "./goals/plan";

export type GoalLambda<T> = (resource: Plan<T>) => Goal<any, T, State<any>>;
export type CandidateLambda<S, T> = (state: S) => T[];
export type GoalFactory<T> = { [key: string]: GoalLambda<T> };
export type CandidateFactory<T> = { [key: string]: CandidateLambda<T, any> };
type Filter<T> = (s: T) => boolean;

export const NOOP: Task = () => { return 0; };

const POS_DIGITS = 2;
const POS_DIGITS_X_2 = POS_DIGITS * 2;

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

export function posAsStr(pos?: {x: number, y: number}): string {
  if (pos === undefined) {
    return "";
  }

  return xyAsStr(pos.x, pos.y);
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
