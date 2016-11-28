import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
// import * as F from "../functions";

export default class CreepState extends State<Creep> {
  public static left(subject: Creep) {
    return CreepState._left.wrap(subject, botMemory()) as CreepState;
  }

  public static right(subject: Creep) {
    return CreepState._right.wrap(subject, botMemory()) as CreepState;
  }

  public static vleft(id: string) {
    return CreepState._vleft.virtual(id, botMemory()) as CreepState;
  }

  public static vright(id: string) {
    return CreepState._vright.virtual(id, botMemory()) as CreepState;
  }

  private static _left: CreepState = new CreepState("CreepStateLeft");
  private static _right: CreepState = new CreepState("CreepStateRight");
  private static _vleft: CreepState = new CreepState("CreepStateVirtualLeft");
  private static _vright: CreepState = new CreepState("CreepStateVirtualRight");

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

  protected _visionSource() {
    return true;
  }

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
      // if (!this.isVirtual()) {
      //   const subject = this.subject();
      // }

      // TODO distance to all sources? value calculations?

      return true;
    }

    return false;
  }
}
