import State from "./abstractState";
import {log} from "../support/log";
import {botMemory, FLYWEIGHTS} from "../../config/config";
import * as F from "../functions";
// const BiMap = require("bimap"); // TODO BiMap

const MOVE_KEYS = {
  // yes i'm being clever here, don't change constants
  ROAD: 1,
  ROAD_LOAD: 0,
  PLAIN: 2,
  PLAIN_LOAD: 3,
  SWAMP: 5,
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

function isZero(n: number) {
  return n === 0;
}

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

export default class CreepState extends State<Creep> {
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
      armor += 100;
    }

    let hull = armor;
    while (i < body.length) {
      if (body[i++].type === MOVE) {
        break;
      }
      hull += 100;
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

  public static left(subject: Creep) {
    return (FLYWEIGHTS ? CreepState._left : new CreepState("CS") ).wrap(subject, botMemory()) as CreepState;
  }

  public static right(subject: Creep) {
    return (FLYWEIGHTS ? CreepState._right : new CreepState("CS") ).wrap(subject, botMemory()) as CreepState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? CreepState._vleft : new CreepState("CS") ).wrapRemote(id, botMemory()) as CreepState;
  }

  public static vright(id: string) {
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
    return _.chain(this.subject().carry).values().all(isZero).value();
  }

  public getCarrying(): number {
    return _.sum(this.subject().carry);
  }

  public body(forFight?: boolean): string {
    if (this.resolve() && this.isWounded()) {
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

  public minMoveFatigue(terrain: number) {
    return this.memory().move[terrain];
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
    return this.maxMovePenalty(terrain) + this.minMoveFatigue(terrain);
  }

  public moveFatigue(terrain?: number, carry?: number) {
    if (terrain === undefined) {
      terrain = 2;
    }

    if (this.resolve() || this.isWounded()) {
      if (carry === undefined) {
        carry = this.getCarrying();
      }
      return CreepState.calculateFatigue(this.subject().body, terrain, carry);
    }

    if (carry === undefined) {
      return this.minMoveFatigue(terrain);
    }

    // TODO is this valid for move penalty?
    return Math.ceil(this.maxMovePenalty(terrain) * CARRY_RECIPROCAL) + this.minMoveFatigue(terrain);
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

  protected _getId(subject: Creep) {
    return subject.name;
  }

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
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
      }

      return true;
    }

    return false;
  }
}
