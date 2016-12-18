import {log} from "../support/log";
import * as F from "../functions";
import * as Config from "../../config/config";
import Named from "../named";
import {botMemory} from "../../config/config";
import EventRegistry from "../event/api/index";
import CreepState from "./creepState";
import getConstructor from "../types";
import AnonCache from "../event/impl/anonCache";
import {SCORE_KEY, ENVIROME_KEY} from "../constants";
import ScoreManager from "../score/scoreManager";
import GlobalState from "./globalState";
import * as Debug from "../util/debug";
import LoDashExplicitArrayWrapper = _.LoDashExplicitArrayWrapper;

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
  if (state._indexAddress() === undefined) {
    return false;
  }
  if (state._id === undefined) {
    return false;
  }

  let memory = F.expand(state._indexAddress(), rootMemory, true) as string[];

  memory.push(state._id);

  return true;
}

function _access(state: any, rootMemory: any, writeValue?: any): any {
  // log.debug(state, "addressing", ... state._accessAddress()); // TODO NOW spread bad es6 perf

  let memory = F.expand(state._accessAddress(), rootMemory);

  if (state._id === undefined) {
    return memory;
  }

  if (writeValue !== undefined && writeValue != null) {
    return memory[state._id] = writeValue;
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
 * so.. what are those rules anyways? follow C++ calling convention, left / right?
 *  left - descend into new functions
 *  right - return from functions
 */
abstract class State<T> implements Named {
  public static readonly LIFECYCLE_NEW = 0;
  public static readonly LIFECYCLE_FREE = 1;
  public static readonly LIFECYCLE_HIDDEN = 2;

  public static setEventRegistry(events: EventRegistry) {
    State.events = events;
  }

  public static setScoreManager(scores: ScoreManager<GlobalState>) {
    State.scores = scores;
  }

  public static vright<I>(className: string, id: string): State<I>|undefined {
    const ctor = (getConstructor(className) as any);
    return ctor === undefined ? undefined : ctor.vright(id); // TODO startPool and transaction?
  }

  protected static events: EventRegistry;
  protected static scores: ScoreManager<GlobalState>;

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

  public wrap(subject: T, memory: any, callback?: LifecycleCallback<State<T>>): State<T> {
    if (this._locked) {
      const s = subject as any;
      throw new Error(s ? (s.id + " " + s.name) : "unknown");
    }

    if (subject === null) {
      throw new Error(this._name);
    }
    this._id = this._getId(subject) as string;

    this._subject = subject;

    this._memory = _access(this, memory);

    // TODO NOW immediately init???
    this.init(memory, callback);

    return this;
  }

  public wrapRemote(id: string, memory: any, callback?: LifecycleCallback<State<T>>): State<T> {
    if (this._locked) {
      throw Debug.throwing(new Error(id));
    }

    if (id === null || id === undefined) {
      throw Debug.throwing(new Error("bad id"));
    }
    this._id = id;

    this._memory = _access(this, memory);

    // TODO NOW defer init???????
    this.init(memory, callback);

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

    return F.expand(key.split("."), this._memory, array);
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
    if (this._visionSource() && this.resolve()) {
      return (this.subject() as any).pos;
    }
    return strAsPos(this._memory.room, this._memory.pos);
  }

  public delete() {
    delete this._memory.seen;
    delete this._memory.pos;
    delete this._memory.room;
  }

  public resolve(lifeCallback?: LifecycleCallback<State<T>>): boolean {
    const subject = this._subject = this._resolve(this._id);

    if (subject !== undefined && subject !== null) {
      return true;
    }

    if (this._visionSource()) {
      if (lifeCallback !== undefined) {
        lifeCallback(this, State.LIFECYCLE_FREE);
      } else {
        Debug.always(); // tell someone!
      }
    } else {
      if (lifeCallback !== undefined) {
        lifeCallback(this, State.LIFECYCLE_HIDDEN);
      } else {
        Debug.always(); // tell someone!
      }
    }

    return false;
  }

  public toString() {
    return "[" + this._name + " " + this._id + " " + this.guid() + "]";
  }

  public setMemory(mem: any) {
    this._memory = _access(this, botMemory(), mem);
  }

  public rescan(callback?: LifecycleCallback<State<T>>) {
    if (callback !== undefined) {
      Debug.always(); // TODO is callback a Joinpoint?
      const grr = AnonCache.instance;
      log.debug(grr.length);
    }
    delete this._memory.seen;
    this.init(botMemory(), callback);
  }

  public onPart(other: CreepState, direction: number) {
    other = other;
    Debug.on("debugTouch");
    this.memory("touch.creep", true)[direction] = null;
    this.memory("touch.types", true)[direction] = null;
    const dirs = this.memory("touch.dir", true) as number[];
    F.remove(dirs, direction);
  }

  public onMeet(other: CreepState, direction: number) {
    Debug.on("debugTouch");
    this.memory("touch.creep", true)[direction] = other.getId();
    this.memory("touch.types", true)[direction] = "CreepState";
    const dirs = this.memory("touch.dir", true) as number[];
    F.add(dirs, direction);
  }

  public onSlide(other: CreepState, newDirection: number) {
    Debug.on("debugTouch");

    const creeps = this.memory("touch.creep", true);
    creeps[newDirection] = other.getId();
    // remove the old direction
    F.arrayUniq(creeps, other.getId(), newDirection);

    // can't remove types, it's a class not a UID
    this.memory("touch.types", true)[newDirection] = "CreepState";
    const dirs = this.memory("touch.dir", true) as number[];
    F.add(dirs, newDirection);
  }

  public touchedCreepIds(): LoDashExplicitArrayWrapper<string> {
    return _.chain(this.memory("touch.creep", true)).compact<string>();
  }

  public isEnergyMover() {
    return false;
  }

  public getEnvirome() {
    return this.memory(ENVIROME_KEY);
  }

  public getScoreMemory() {
    return this.memory(SCORE_KEY);
  }

  public getScore(metric: string): number {
    const mem = this.getScoreMemory();
    let calculated = State.scores.getScore(mem, metric, undefined);
    if (calculated === undefined) {
      calculated = State.scores.rescore(this, mem, metric, Game.time);
      if (calculated === undefined) {
        Debug.always(); // can't score
        log.debug("can't score", metric);
        return 0;
      }
    }
    return calculated;
  }

  public getOrRescore(metric?: string, time?: number): number {
    return State.scores.getOrRescore(this, this.getScoreMemory(), metric, time);
  }

  public rescore(metric?: string, time?: number) {
    return State.scores.rescore(this, this.getScoreMemory(), metric, time);
  }

  public setScore(metric: string, value: number) {
    State.scores.rescore(this, this.getScoreMemory(), metric, Game.time, value);
  }

  public copyScore(dstMetric: string, srcMetric: string) {
    const value = this.getScore(srcMetric);
    this.setScore(dstMetric, value);
  }

  protected abstract _accessAddress(): string[];
  protected abstract _indexAddress(): string[]|undefined;

  protected _visionSource() {
    return false;
  }

  protected guid(): number {
    return this._memory === undefined ? 0 : this._memory.seen;
  }

  protected init(rootMemory: any, callback?: LifecycleCallback<State<T>>): boolean {
    callback = callback; // utilized by implementers
    if (this._memory === undefined) {
      return false;
    }

    if (this._memory.seen === undefined) {
      const guid = Config.MEMORY_GUID ? (1 + Math.random()) : 1;
      this._memory.seen = guid;
      if (Config.MEMORY_GUID) {
        log.debug(this, "initializing");
      }
      this.updatePosition(this._subject);

      _register(this, rootMemory);

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
