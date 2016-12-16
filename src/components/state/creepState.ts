import State from "./abstractState";
import {log} from "../support/log";
import {botMemory, FLYWEIGHTS} from "../../config/config";
import * as F from "../functions";
import {TERRAIN_ROAD, TERRAIN_PLAIN, TERRAIN_SWAMP} from "../constants";
import LookForIterator from "../util/lookForIterator";
import Joinpoint from "../event/api/joinpoint";
import LoDashExplicitArrayWrapper = _.LoDashExplicitArrayWrapper;
import {globalLifecycle} from "../event/behaviorContext";
// const BiMap = require("bimap"); // TODO BiMap

const MOVE_KEYS = {
  // yes i'm being clever here, don't change constants
  ROAD: TERRAIN_ROAD,
  ROAD_LOAD: 0,
  PLAIN: TERRAIN_PLAIN,
  PLAIN_LOAD: 3,
  SWAMP: TERRAIN_SWAMP,
  SWAMP_LOAD: 4,
};

const BODY_CHAR_BODY: { [key: string]: string } = {
  A: ATTACK,
  attack: "A",
  C: CARRY,
  carry: "C",
  claim: "L",
  H: HEAL,
  heal: "H",
  L: CLAIM,
  M: MOVE,
  move: "M",
  R: RANGED_ATTACK,
  ranged_attack: "R",
  T: TOUGH,
  tough: "T",
  W: WORK,
  work: "W",
};

const WORK_FIGHT: { [key: string]: number } = {
  A: -1,
  C: 1,
  H: -1,
  L: 1,
  R: -1,
  T: -1,
  W: 0,
};

const CARRY_RECIPROCAL = 1 / 50;

/**
 * parts for working, excludes move, includes work
 */
function isForWork(b: string) {
  return WORK_FIGHT[b] >= 0;
}

/**
 * parts for fighting, excludes move, includes work
 */
function isForFight(b: string) {
  return WORK_FIGHT[b] <= 0;
}

function sparseExactDifference<T>(a: T[], b: T[]) {
  const result: T[] = [];
  for (let i = a.length - 1; i >= 0; i--) {
    const found = b.indexOf(a[i]);
    if (found >= 0 && found !== i) { // indexOf is strict ===
      result[i] = a[i];
    }
  }
  return result;
}

function sparseDifference<T>(a: T[], b: T[]) {
  const result: T[] = [];
  for (let i = a.length - 1; i >= 0; i--) {
    if (b.indexOf(a[i]) < 0) { // indexOf is strict ===
      result[i] = a[i];
    }
  }
  return result;
}

function changes<T>(oldList: T[], newList: T[]): {removed: T[], added: T[], slid: T[]} {
  const removed = sparseDifference(oldList, newList);
  const added = sparseDifference(newList, oldList);
  const slid = sparseExactDifference(newList, oldList);

  return {removed, added, slid};
}

function iterateNeighbors(neighborIds: string[],
                          type: (i: number) => any,
                          callbackName: string,
                          args: (i: number) => any[]) {
  for (let dir = neighborIds.length - 1; dir >= 0; dir--) {
    const id = neighborIds[dir];
    if (id === undefined || id === null || type(dir) === undefined) {
      continue;
    }
    const instance = State.vright(type(dir), id) as any;
    if (instance === undefined) {
      throw new Error("cannot resolve " + id + " from " + JSON.stringify(type(dir)));
    }
    instance[callbackName](...args(dir)); // TODO NOW spread bad es6 perf
  }
}

export default class CreepState extends State<Creep> {
  public static apiType() {
    return Creep;
  }

  public static calculateBody(body: BodyPartDefinition[], forFight: boolean, max?: boolean): string {
    // bimap: new BiMap(), // testing TODO REMOVE
    // sort and extract current effectiveness
    let filtered = _.chain(body);
    if (!max) {
      filtered = filtered.filter((s: BodyPartDefinition) => s.hits > 0);
    }
    return filtered.map((s: BodyPartDefinition) => BODY_CHAR_BODY[s.type])
      .filter( forFight ? isForFight : isForWork ).sortBy().join("").value();
  }

  public static calculateArmorAndHull(body: BodyPartDefinition[]) {
    let i = 0;

    let armor = 99;
    while (i < body.length) {
      if (body[i++].type !== TOUGH) {
        break;
      }
      armor = armor + 100;
    }

    let hull = armor;
    while (i < body.length) {
      if (body[i++].type === MOVE) {
        break;
      }
      hull = hull + 100;
    }
    return { armor, hull };
  }

  public static calculateFatigue(body: BodyPartDefinition[], terrain: number, carry: number): number {
    const moveDiscount = 2 / terrain;
    let sum = 0;
    for (let i = body.length - 1; i >= 0; i--) {
      const b = body[i];
      switch (b.type) {
        case CARRY:
          carry -= 50;
          if (carry < 0) {
            break; // empty, no cost
          }
          // fall thru!
        default:
          sum++;
          break;

        case MOVE:
          if (b.hits > 0) {
            sum -= moveDiscount;
          }
          break;
      }
      // TODO validate the shortcut
      // if (sum < -i) {
      //   return 0;
      // }
    }

    return Math.round(sum * terrain);
  }

  public static left(subject: Creep): CreepState { // TODO as CreepState & Creep and use a proxy?
    return (FLYWEIGHTS ? CreepState._left : new CreepState("CS") ).wrap(subject, botMemory()) as CreepState;
  }

  public static right(subject: Creep): CreepState {
    return (FLYWEIGHTS ? CreepState._right : new CreepState("CS") ).wrap(subject, botMemory()) as CreepState;
  }

  public static vleft(id: string): CreepState {
    return (FLYWEIGHTS ? CreepState._vleft : new CreepState("CS") ).wrapRemote(id, botMemory()) as CreepState;
  }

  public static vright(id: string): CreepState {
    return (FLYWEIGHTS ? CreepState._vright : new CreepState("CS") ).wrapRemote(id, botMemory()) as CreepState;
  }

  public static build(creep: Creep): CreepState {
    return new CreepState("CS").wrap(creep, botMemory()) as CreepState;
  }

  public static copy(creep: CreepState): CreepState {
    if (creep.isRemote()) {
      return new CreepState("CS").wrapRemote(creep.getId(), botMemory()) as CreepState;
    }
    return CreepState.build(creep.subject());
  }

  protected static _left: CreepState = new CreepState("CreepStateLeft");
  protected static _right: CreepState = new CreepState("CreepStateRight");
  protected static _vleft: CreepState = new CreepState("CreepStateVirtualLeft");
  protected static _vright: CreepState = new CreepState("CreepStateVirtualRight");

  public className() {
    return "CreepState";
  }

  public delete() {
    super.delete();

    delete this._memory.nodes;

    log.debug("delete", this);
  }

  /**
   * a hit creep is loging functionality
   */
  public isHit(): boolean {
    const creep = this.subject();
    return creep.hitsMax - creep.hits > this.memory().armor;
  }

  /**
   * a wounded creep is losing movement
   */
  public isWounded(): boolean {
    const creep = this.subject();
    return creep.hitsMax - creep.hits > this.memory().hull;
  }

  public isCarrying(): boolean {
    // TODO put # of carry parts in memory
    return _.chain(this.subject().carry).values().all(i => i === 0).value();
  }

  public getWeight(): number {
    return this.isRemote() ? 25 : this.subject().body.length;
  }

  public getCarrying(): number {
    return _.sum(this.subject().carry);
  }

  public body(forFight?: boolean): string {
    if (this.resolve(globalLifecycle) && this.isWounded()) {
      return CreepState.calculateBody(this.subject().body, forFight === true);
    }
    return this.maxBody(forFight);
  }

  public maxBody(forFight?: boolean): string {
    const mem = this.memory();
    return forFight ? mem.worker : F.elvis(mem.fighter, mem.seal);
  }

  public isCommando(): boolean {
    return this.memory().seal !== undefined;
  }

  // TODO behavior tests for fatigue functions?
  public minMoveFatigue(terrain: number) {
    return Math.max(1, this.memory().move[terrain]);
  }

  public maxMovePenalty(terrain: number) {
    if (terrain === MOVE_KEYS.PLAIN) { // MAGIC
      terrain++;
    } else {
      terrain--;
    }
    return this.memory().move[terrain];
  }

  public maxMoveFatigue(terrain: number) {
    return Math.max(1, this.maxMovePenalty(terrain) + this.minMoveFatigue(terrain));
  }

  public moveFatigue(terrain?: number, carry?: number) {
    if (terrain === undefined) {
      terrain = 2;
    }

    if (this.resolve(globalLifecycle) || this.isWounded()) {
      if (carry === undefined) {
        carry = this.getCarrying();
      }
      return Math.max(1, CreepState.calculateFatigue(this.subject().body, terrain, carry));
    }

    if (carry === undefined) {
      return this.minMoveFatigue(terrain);
    }

    // TODO is this valid for move penalty?
    return Math.max(1, Math.ceil(this.maxMovePenalty(terrain) * CARRY_RECIPROCAL) + this.minMoveFatigue(terrain));
  }

  public touching(jp: Joinpoint<CreepState, void>, fromPos: RoomPosition, forwardDir: number) {
    jp = jp;
    forwardDir = forwardDir;

    if ((botMemory() as Commands).debugTouch) {
      debugger; // Commands.debugTouch
    }

    const selfpos = this.pos();
    if (fromPos.x === selfpos.x && fromPos.y === selfpos.y) {
      debugger; // touching, same position, move failed?
      throw new Error("birthday violation! TOO SOON! TRY AGAIN!");
    }

    const newCreeps: string[] = [];
    const newEnergy: string[] = [];
    const newTypes: string[] = [];
    const newDrops: { [resource: string]: string[] } = {};

    const posToDir = F.posToDirection(selfpos);
    LookForIterator.search(selfpos, 1, this, [{
      key: LOOK_CREEPS, value: function(creep: Creep, range: number) {
        if (range < 1) {
          return true;
        }
        const dir = posToDir(creep.pos);
        newCreeps[dir] = creep.id;
        newTypes[dir] = "CreepState";
        return true;
      },
    }, {
      key: LOOK_STRUCTURES, value: function(struct: OwnedStructure, range: number) {
        range = range;
        const i = posToDir(struct.pos);
        switch (struct.structureType) {
          case STRUCTURE_SPAWN:
            newTypes[i] = struct.structureType;
          case STRUCTURE_CONTAINER:
          case STRUCTURE_EXTENSION:
          case STRUCTURE_STORAGE:
          case STRUCTURE_TOWER:
            newEnergy[i] = struct.id;

            break;

          default:
        }
        return true;
      },
    }, {
      key: LOOK_ENERGY, value: function(resource: Resource) {
        const i = posToDir(resource.pos);
        const type = F.expand([resource.resourceType], newDrops, true);
        type[i] = resource.id;
        return true;
      },
    }, {
      key: LOOK_RESOURCES, value: function(resource: Resource) {
        const i = posToDir(resource.pos);
        const type = F.expand([resource.resourceType], newDrops, true);
        type[i] = resource.id;
        return true;
      },
    }]);

    // TODO transact touch directions
    const oldCreeps = F.elvis(this.memory("touch").creep, []);
    const oldEnergy = F.elvis(this.memory("touch").energy, []);
    const oldTypes = F.elvis(this.memory("touch").types, []);

    // TODO when I move, I need to tell my neighbors about my new position even if I'm not saying goodbye - onSlide
    const self = this;
    const structs = changes(oldEnergy, newEnergy);

    const argFunc = function(dir: number) {
      return [self, F.reverse(dir)];
    };

    iterateNeighbors(structs.removed, dir => oldTypes[dir], "onPart", argFunc);
    iterateNeighbors(structs.added, dir => newTypes[dir], "onMeet", argFunc);
    iterateNeighbors(structs.slid, dir => newTypes[dir], "onSlide", argFunc);

    const creeps = changes(oldCreeps, newCreeps);

    iterateNeighbors(creeps.removed, () => "CreepState", "onPart", argFunc);
    iterateNeighbors(creeps.added, () => "CreepState", "onMeet", argFunc);
    iterateNeighbors(creeps.slid, () => "CreepState", "onSlide", argFunc);

    this.memory("touch").creep = newCreeps;
    this.memory("touch").energy = newEnergy;
    this.memory("touch").types = newTypes;
    this.memory("touch").drops = newDrops;
  }

  public keepSaying(say: string, toPublic?: boolean, count?: number) {
    if (count !== undefined && --count <= 0) {
      return;
    }

    // TODO restore
    // eventManager.schedule(1, this)
    //   .on("say", this.keepSaying, say, toPublic, count);
    if (this.resolve(globalLifecycle)) {
      this.subject().say(say, toPublic);
    }
  }

  public beforeDeath() {
    if (this.resolve(globalLifecycle)) {
      const s = this.subject();
      if (s.carry.energy) {
        s.drop(RESOURCE_ENERGY);
      }
      if (s.carry.power) {
        s.drop(RESOURCE_POWER);
      }
      for (const t in s.carry) {
        s.drop(t);
      }
    }
  }

  public isReady() {
    return this.resolve(globalLifecycle) && this.subject().ticksToLive !== undefined;
  }

  public isEnergyMover() {
    return true;
  }

  public touchedDropTypes(): string[] {
    return _.keys(this.memory("touch.drops"));
  }

  public touchedDrops(type: string): LoDashExplicitArrayWrapper<Resource> {
    const drops = this.memory("touch.drops");
    return _.chain(F.elvis(drops[type], [])).compact<string>().map(Game.getObjectById).compact();
  }

  public touchedStorage(): LoDashExplicitArrayWrapper<State<any>> {
    const types = this.memory("touch.types", true);
    return _.chain(this.memory("touch.energy", true) as string[]) // don't compact, order matters
      .map((s, i) => (s ? State.vright(types[i], s) : null) as State<any>).compact();
  }

  protected _accessAddress() {
    return ["creeps"];
  }

  protected _indexAddress() {
    return ["index", "creeps"];
  }

  protected _visionSource() {
    return true;
  }

  // TODO extend _resolve and required timeToLive !== undefined?

  protected init(rootMemory: any, callback?: LifecycleCallback<CreepState>): boolean {
    if (super.init(rootMemory, callback)) {
      if (this.resolve()) {
        const creep = this.subject();

        const move = this.memory("move", true);
        const okRoad = move[MOVE_KEYS.ROAD] = CreepState.calculateFatigue(creep.body, 1, 0);
        const roadLoad = move[MOVE_KEYS.ROAD_LOAD]
          = CreepState.calculateFatigue(creep.body, 1, this.subject().carryCapacity) - okRoad;
        const okMove = move[MOVE_KEYS.PLAIN] = CreepState.calculateFatigue(creep.body, 2, 0);
        move[MOVE_KEYS.PLAIN_LOAD] = CreepState.calculateFatigue(creep.body, 2, this.subject().carryCapacity) - okMove;
        const okSwamp = move[MOVE_KEYS.SWAMP] = CreepState.calculateFatigue(creep.body, 5, 0);
        move[MOVE_KEYS.SWAMP_LOAD] = CreepState.calculateFatigue(creep.body, 5, this.subject().carryCapacity) - okSwamp;

        this.memory().worker = CreepState.calculateBody(creep.body, false) + roadLoad;
        if (okSwamp < 3) {
          this.memory().seal = CreepState.calculateBody(creep.body, true) + okSwamp + "*";
        } else {
          this.memory().fighter = CreepState.calculateBody(creep.body, true) + okMove;
        }

        const {armor, hull} = CreepState.calculateArmorAndHull(creep.body);
        this.memory().armor = armor;
        this.memory().hull = hull;

        // TODO creepstate behavior seed

        if (creep.ticksToLive !== undefined) {
          // on re-init these will be duplicated
          // TODO restore (and merge)
          // eventManager.schedule(creep.ticksToLive - 10, this)
          //   .on("say", this.keepSaying, "💀", true, 10); // dying
          // eventManager.schedule(creep.ticksToLive - 1, this)
          //   .onDeath(this.beforeDeath);
          // eventManager.schedule(creep.ticksToLive - 1499, this)
          //   .on("say", this.keepSaying, "🎂", true, 3); // birthday
        }
      }

      if (callback !== undefined) {
        callback(this, State.LIFECYCLE_NEW);
      }

      return true;
    }

    return false;
  }
}
