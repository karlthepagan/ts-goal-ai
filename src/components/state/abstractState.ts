import {log} from "../support/log";
import * as F from "../functions";
import Named from "../named";
import EventRegistry from "../event/api/index";
import CreepState from "./creepState";
import getConstructor from "../types";
import ScoreManager from "../score/scoreManager";
import * as Debug from "../util/debug";
import LoDashExplicitArrayWrapper = _.LoDashExplicitArrayWrapper;
import ScoreMixin from "../score/scoreMixin";
import {Score} from "../score/api/score";

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
    return true;
  }
  if (state._id === undefined) {
    return false;
  }

  let memory = F.expand(state._indexAddress(), rootMemory, {});

  if (memory[state._id]) {
    return false;
  }

  memory[state._id] = true; // TODO SOON, parent guid?

  return true;
}

function _access(state: any, rootMemory: any, writeValue?: any): any {
  // log.debug(state, "addressing", ... state._accessAddress()); // TODO NOW spread bad es6 perf
  const addr = state._accessAddress();

  if (!addr) {
    return undefined;
  }

  let memory = F.expand(state._accessAddress(), rootMemory);

  if (state._id === undefined) {
    return memory;
  }

  if (writeValue) {
    return memory[state._id] = writeValue;
  }

  if (memory[state._id] === undefined) {
    return memory[state._id] = {};
  }

  return memory[state._id];
}

export interface CachedObject {
  id: string;
  type: string;
}

export interface CachedObjectPos extends CachedObject {
  range: number;
  pos: RoomPosition;
  dir?: number;
}

export interface GraphBuilder {
  buildGraph(root: State<any>): CachedObjectPos[];
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
  public static ENTITY_ADDRESS = _.chain([LOOK_SOURCES, LOOK_MINERALS]).indexBy(_.identity).merge(
    _.chain(CONSTRUCTION_COST).keys().concat(STRUCTURE_PORTAL, STRUCTURE_CONTROLLER, STRUCTURE_POWER_BANK)
      .map(s => [s, LOOK_STRUCTURES]).object().value()).value() as { [type: string]: string };
  public static TYPES = _.chain(State.ENTITY_ADDRESS).keys()
    .map(s => [s, {type: s, range: 1}]).zipObject().value() as { [type: string]: CachedObjectPos };
  public static GAME_INDEX = {
    [LOOK_CREEPS]: "creeps",
    [LOOK_STRUCTURES]: "structures",
    [LOOK_CONSTRUCTION_SITES]: "constructionSites",
    [LOOK_FLAGS]: "flags",
  };

  public static readonly LIFECYCLE_NEW = 0;
  public static readonly LIFECYCLE_FREE = 1;
  public static readonly LIFECYCLE_HIDDEN = 2;
  public static rootMemory: any;
  public static events: EventRegistry;
  public static scores: ScoreManager;
  public static graphs: GraphBuilder;

  public static setEventRegistry(events: EventRegistry) {
    State.events = events;
  }

  public static setScoreManager(scores: ScoreManager) {
    State.scores = scores;
  }

  public static setRootMemory(mem: any, graphs?: GraphBuilder) {
    State.rootMemory = mem;
    if (graphs) {
      State.graphs = graphs;
    }
  }

  public static vright<I>(className: string, id: string): State<I>|undefined {
    const ctor = (getConstructor(className) as any);
    return ctor === undefined ? undefined : ctor.vright(id); // TODO startPool and transaction?
  }

  public memory: any;
  public abstract score: Score; // most states have energy score
  /**
   * describes flywight handedness for debugging
   */
  protected _name: string;
  protected _id: string;
  protected _subject: T|undefined;
  protected _locked: boolean = false;

  constructor(name: string) {
    this._name = name;
    this.score = ScoreMixin.withDefaults(this) as any; // Object.setPrototype recommended!
  }

  public abstract className(): string;
  public abstract getType(): string;

  public isFull(): boolean {
    return false;
  }

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

    this.memory = _access(this, memory);

    // TODO NOW immediately init???
    this.init(memory, callback);

    State.scores.pickStrategy(this);

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

    this.memory = _access(this, memory);

    // TODO NOW defer init???????
    this.init(memory, callback);

    State.scores.pickStrategy(this);

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
    return strAsPos(this.memory.room, this.memory.pos);
  }

  public delete() {
    delete this.memory.pos;
    delete this.memory.room;
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
        Debug.always("something died"); // tell someone!
      }
    } else {
      if (lifeCallback !== undefined) {
        lifeCallback(this, State.LIFECYCLE_HIDDEN);
      } else {
        Debug.always("something is hidden"); // tell someone!
      }
    }

    return false;
  }

  public toString() {
    return "[" + this._name + " " + this._id + "]";
  }

  public setMemory(mem: any) {
    this.memory = _access(this, State.rootMemory, mem);
  }

  public rescan(callback?: LifecycleCallback<State<T>>) {
    if (callback !== undefined) {
      Debug.always("rescan callback is undefined"); // TODO is callback a Joinpoint?
    }
    this.init(State.rootMemory, callback);
  }

  public onPart(other: CreepState, direction: number) {
    other = other;
    Debug.on("debugTouch");
    this.memory.touch[LOOK_CREEPS][direction] = null;
    this.memory.touch.types[direction] = null;
    F.remove(this.memory.touch.dir, direction);
  }

  public onMeet(other: CreepState, direction: number) {
    Debug.on("debugTouch");
    this.memory.touch[LOOK_CREEPS][direction] = other.getId();
    this.memory.touch.types[direction] = "CreepState";
    const dirs = this.memory.touch.dir as number[];
    F.add(dirs, direction);
  }

  public onSlide(other: CreepState, newDirection: number) {
    Debug.on("debugTouch");

    const creeps = this.memory.touch[LOOK_CREEPS];
    creeps[newDirection] = other.getId();
    // remove the old direction
    F.arrayUniq(creeps, other.getId(), newDirection);

    // can't remove types, it's a class not a UID
    this.memory.touch.types[newDirection] = "CreepState";
    const dirs = this.memory.touch.dir as number[];
    F.add(dirs, newDirection);
  }

  public touchedCreepIds(): LoDashExplicitArrayWrapper<string> {
    return _.chain(this.memory.touch[LOOK_CREEPS]).compact<string>();
  }

  public isEnergyMover() {
    return false;
  }

  public getEnvirome() {
    return this.memory.envirome;
  }

  // public getScoreMemory() {
  //   return this.memory.score;
  // }
  //
  // public getScore(metric: string): number {
  //   const mem = this.getScoreMemory();
  //   let calculated = State.scores.getScore(mem, metric, undefined);
  //   if (calculated === undefined) {
  //     calculated = State.scores.rescore(this, mem, metric, Game.time);
  //     if (calculated === undefined) {
  //       Debug.always("can't score"); // can't score
  //       log.debug("can't score", metric);
  //       return 0;
  //     }
  //   }
  //   return calculated;
  // }
  //
  // public getOrRescore(metric?: string, time?: number): number {
  //   return State.scores.getOrRescore(this, this.getScoreMemory(), metric, time);
  // }
  //
  // public rescore(metric?: string, time?: number) {
  //   return State.scores.rescore(this, this.getScoreMemory(), metric, time);
  // }
  //
  // public setScore(metric: string, value: number) {
  //   State.scores.rescore(this, this.getScoreMemory(), metric, Game.time, value);
  // }
  //
  // public copyScore(dstMetric: string, srcMetric: string) {
  //   const value = this.getScore(srcMetric);
  //   this.setScore(dstMetric, value);
  // }

  protected abstract _accessAddress(): string[];
  protected abstract _indexAddress(): string[]|undefined;

  protected _visionSource() {
    return false;
  }

  // TODO later - add inherited defaults to suppress "touch" and "score"
  protected init(rootMemory: any, callback?: LifecycleCallback<State<T>>): boolean {
    callback = callback; // utilized by implementers
    if (!this.memory || typeof this.memory !== "object") {
      return false;
    }

    if (!_register(this, rootMemory)) {
      return false;
    }

    if (this.memory.score) {
      return false;
    }

    this.memory = _.defaultsDeep(this.memory, _.cloneDeep({
      score: {},
      touch: {
        creep: [] as string[],
        energy: [] as string[],
        types: [] as string[],
        dir: [] as number[],
      },
    }));

    this.updatePosition(this._subject);

    return true;
  }

  protected updatePosition(s: any) {
    if (this._visionSource() || this.isRemote()) {
      // vision sources rely on subject for position information
      return;
    }
    if (s.pos !== undefined) {
      this.memory.pos = posAsStr(s.pos as XY);
    }
    if (s.roomName !== undefined) {
      this.memory.room = s.roomName;
    } else if (s.room !== undefined) {
      this.memory.room = s.room.name;
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
