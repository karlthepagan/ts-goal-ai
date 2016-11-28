import State from "./abstractState";
import {log} from "../support/log";
import {botMemory, FLYWEIGHTS} from "../../config/config";
// import * as F from "../functions";

export default class CreepState extends State<Creep> {
  public static CLASS_NAMES = [
    "CreepState",
    "CreepState(enemy)",
  ];

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
      // if (!this.isRemote()) {
      //   const subject = this.subject();
      // }

      // TODO distance to all sources? value calculations?

      return true;
    }

    return false;
  }
}
