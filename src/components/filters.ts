type UnaryVoidLambda = (s: any) => boolean;

const POS_DIGITS = 2;
const POS_DIGITS_X_2 = POS_DIGITS * 2;

function TRUE() {
  return true;
}

function FALSE() {
  return false;
}

function RAMPART(s: any) {
  return s.my;
}

function elvis<T>(x: T|undefined, y: T): T {
  return x === undefined ? y : x;
}

const movable: { [key: string]: UnaryVoidLambda } = {
  plain: TRUE as UnaryVoidLambda,
  rampart: RAMPART,
  swamp: TRUE as UnaryVoidLambda,
};

export function isMovable(lookAt: LookAtResultWithPos): boolean {
  return elvis(movable[lookAt.terrain as string], FALSE as UnaryVoidLambda)(lookAt);
}

export function pad(num: any, size: number) {
  return ("000000000" + num).substr(-size);
}

export function xyAsStr(x: number, y: number): string {
  return pad(x, POS_DIGITS) + pad(y, POS_DIGITS);
}

export function posAsStr(pos?: RoomPosition): string {
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
