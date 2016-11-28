import {log} from "../support/log";
import * as F from "../functions";
import * as Config from "../../config/config";
import Named from "../named";

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

function _register(state: any, rootMemory: any): boolean {
  if (state._indexAddress === undefined) {
    return false;
  }
  if (state._id === undefined) {
    return false;
  }

  let memory = F.expand(state._indexAddress, rootMemory, true) as string[];

  memory.push(state._id);

  return true;
}

function _access(state: any, rootMemory: any): any {
  // log.debug(state, "addressing", ...state._accessAddress);

  let memory = F.expand(state._accessAddress, rootMemory);

  if (state._id === undefined) {
    return memory;
  }

  if (memory[state._id] === undefined) {
    return memory[state._id] = {};
  }

  return memory[state._id];
}

/**
 * Flyweight objects which wrap memory and object to calculate state
 *
 * all implementers provide a "left" and "right" objects, as well as virtual left and right
 *
 * these handed flyweights allows for nested comparisons if programming rules are enforced
 *
 * so... what are those rules anyways? follow C++ calling convention, left / right?
 *  left - descend into new functions
 *  right - return from functions
 */
abstract class State<T> implements Named {
  protected _accessAddress: string[];
  protected _indexAddress: string[]|undefined;

  /**
   * describes flywight handedness for debugging
   */
  protected _name: string;
  protected _id: string;
  protected _subject: T|undefined;
  protected _memory: any;
  protected _locked: boolean = false;

  constructor(name: string) {
    this._name = name;
  }

  public abstract className(): string;

  public wrap(subject: T, memory: any): State<T> {
    if (this._locked) {
      throw new Error(this.toString());
    }

    if (subject === null) {
      throw new Error(this._name);
    }
    this._id = this._getId(subject) as string;

    this._subject = subject;

    this._memory = _access(this, memory);

    this.init(memory);

    return this;
  }

  public wrapRemote(id: string, memory: any): State<T> {
    if (this._locked) {
      throw new Error(this.toString());
    }

    this._id = id;

    this._memory = _access(this, memory);

    this.init(memory);

    return this;
  }

  public lock() {
    this._locked = true;
  }

  public release() {
    this._locked = false;
  }

  public subject(): T {
    return this._subject as T;
  }

  public getId(): string {
    return this._id;
  }

  public memory(key?: string, array?: boolean): any {
    if (key === undefined) {
      return this._memory;
    }

    return F.expand([ key ], this._memory, array);
  }

  public isPaused(): boolean {
    return this._memory === undefined;
  }

  public isRemote(reason?: string): boolean {
    const virtual = this._subject === undefined;
    if (virtual && reason !== undefined) {
      log.warning("isRemote true:", reason);
    }
    return virtual;
  }

  public pos(): RoomPosition {
    if (this._visionSource()) {
      return (this.subject() as any).pos;
    }
    return strAsPos(this._memory.room, this._memory.pos);
  }

  public delete() {
    delete this._memory.seen;
    delete this._memory.pos;
    delete this._memory.room;
  }

  public resolve(): boolean {
    const subject = this._subject = this._resolve(this._id);

    return subject !== undefined && subject !== null;
  }

  public toString() {
    return "[" + this._name + " " + this._id + " " + this.guid() + "]";
  }

  protected _visionSource() {
    return false;
  }

  protected guid(): number {
    return this._memory === undefined ? 0 : this._memory.seen;
  }

  protected init(rootMemory: any): boolean {
    if (this._memory === undefined) {
      return false;
    }

    // log.debug("at", this, ":", this._memory);

    if (this._memory.seen === undefined) {
      const guid = Config.MEMORY_GUID ? (1 + Math.random()) : 1;
      this._memory.seen = guid;
      if (Config.MEMORY_GUID) {
        log.debug(this, "initializing");
      }
      this.updatePosition(this._subject);

      _register(this, rootMemory);

      // TODO callback promises registered for new memory objects

      return true;
    }

    return false;
  }

  protected updatePosition(s: any) {
    if (this._visionSource() || this.isRemote()) {
      // vision sources rely on subject for position information
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

  protected _resolve(id: string): T {
    return Game.getObjectById(id) as T;
  }

  protected _getId(subject: T): string|undefined {
    return (subject as any).id;
  }
}
export default State;
