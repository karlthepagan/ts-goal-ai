const POS_DIGITS = 2;
const POS_DIGITS_X_2 = POS_DIGITS * 2;

type XY = {x: number, y: number};

function strAsPos(room: string, serialized?: string): RoomPosition {
  if (serialized === undefined) {
    return new RoomPosition(25, 25, room);
  }

  return new RoomPosition(
    +serialized.substring(0, POS_DIGITS),
    +serialized.substring(POS_DIGITS, POS_DIGITS_X_2),
    room);
}

function posAsStr(pos: XY): string {
  return pad(pos.x, POS_DIGITS) + pad(pos.y, POS_DIGITS);
}

function pad(num: any, size: number) {
  return ("000000000" + num).substr(-size);
}

/**
 * Flyweight objects which wrap memory and object to calculate state
 */
abstract class State<T> {
  /**
   * describes flywight handedness for debugging
   */
  protected abstract _memAddress: string[];
  protected _name: string;
  protected _id: string;
  protected _subject: T|undefined;
  protected _memory: any;

  constructor(name: string) {
    this._name = name;
  }

  public wrap(subject: T, memory: any): State<T> {
    this._id = this._getId(subject);
    this._subject = subject;
    this._memory = this._access(memory);

    this.init();

    return this;
  }

  public virtual(id: string, memory: any): State<T> {
    this._id = id;
    this._memory = this._access(memory);

    this.init();

    return this;
  }

  public subject(): T {
    return this._subject as T;
  }

  public memory(): any {
    return this._memory;
  }

  public isPaused(): boolean {
    return this._memory === undefined;
  }

  public isVirtual(): boolean {
    return this._subject === undefined;
  }

  public pos() {
    return strAsPos(this._memory.room, this._memory.pos);
  }

  public delete() {
    delete this._memory.seen;
    delete this._memory.pos;
    delete this._memory.room;
  }

  public resolve(): boolean {
    const subject = this._subject = this._resolve(this._id);
    if (subject === undefined) {
      return false;
    }

    return true;
  }

  public abstract toString(): string;

  protected init(): boolean {
    if (this._memory === undefined) {
      return false;
    }

    // console.log("at", this, ":", JSON.stringify(this._memory));

    if (this._memory.seen === undefined) {
      this._memory.seen = 1;
      this.updatePosition(this._subject);

      return true;
    }

    return false;
  }

  protected updatePosition(s: any) {
    if (s === undefined) {
      return;
    }
    if (s.pos !== undefined) {
      this._memory.pos = posAsStr(s.pos as XY);
    }
    if (s.roomName !== undefined) {
      this._memory.room = s.roomName;
    } else if (s.room !== undefined) {
      this._memory.room = s.room.name;
    }
  }

  protected _access(memory: any): any {
    for (const addr of this._memAddress) {
      if (memory[addr] === undefined) {
        memory = memory[addr] = {};
      } else {
        memory = memory[addr];
      }
    }

    if (memory[this._id] === undefined) {
      return memory[this._id] = {};
    }
    return memory[this._id];
  }

  protected _resolve(id: string): T {
    return Game.getObjectById(id) as T;
  }

  protected _getId(subject: T): string {
    return (subject as any).id;
  }
}
export default State;
