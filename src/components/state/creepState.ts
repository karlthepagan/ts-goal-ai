import State from "./abstractState";
import {log} from "../support/log";
import {botMemory, FLYWEIGHTS} from "../../config/config";
// import * as F from "../functions";
// const BiMap = require("bimap"); // TODO BiMap

const BODY_CHAR_BODY: { [body: string]: string } = {
  A: ATTACK,
  attack: "A",
  C: CARRY,
  carry: "C",
  claim: "L",
  H: HEAL,
  heal: "H",
  L: "claim",
  M: MOVE,
  move: "M",
  R: RANGED_ATTACK,
  ranged_attack: "R",
  T: TOUGH,
  tough: "T",
  W: WORK,
  work: "W",
};

export default class CreepState extends State<Creep> {
  public static calculateBody(body: BodyPartDefinition[], max?: boolean): string {
    // bimap: new BiMap(), // testing TODO REMOVE
    // sort and extract current effectiveness
    let filtered = _.chain(body);
    if (!max) {
      filtered = filtered.filter((s: BodyPartDefinition) => s.hits > 0);
    }
    return filtered.sortBy().map((s: string) => BODY_CHAR_BODY[s]).join().value();
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

  protected static _left: CreepState = new CreepState("CreepStateLeft");
  protected static _right: CreepState = new CreepState("CreepStateRight");
  protected static _vleft: CreepState = new CreepState("CreepStateVirtualLeft");
  protected static _vright: CreepState = new CreepState("CreepStateVirtualRight");

  protected _accessAddress = ["creeps"];
  protected _indexAddress = ["index", "creeps"];

  public className() {
    return "CreepState";
  }

  public delete() {
    super.delete();

    delete this._memory.nodes;

    log.debug("delete", this);
  }

  public body() {
    if (this.resolve() ) {
      return CreepState.calculateBody(this.subject().body);
    }
    return this.maxBody();
  }

  public maxBody() {
    return this.memory().maxBody;
  }

  public moveFatigue(terrain: string, carry?: boolean|undefined) {
    terrain = terrain;
    carry = carry;
    // plain: 2
    // swamp: 5
    // road: 1
    // TODO fatigue per non-empty part
    return 1;
  }

  protected _visionSource() {
    return true;
  }

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
      if (this.resolve()) {
        const creep = this.subject();
        this.memory().maxBody = CreepState.calculateBody(creep.body, true);
        this.memory().maxPlain = this.moveFatigue("plain", true);
        this.memory().maxRoad = this.moveFatigue("road", true);
        this.memory().maxSwamp = this.moveFatigue("swamp", true);
        this.memory().minPlain = this.moveFatigue("plain", false);
        this.memory().minRoad = this.moveFatigue("road", false);
        this.memory().minSwamp = this.moveFatigue("swamp", false);
      }

      return true;
    }

    return false;
  }
}
