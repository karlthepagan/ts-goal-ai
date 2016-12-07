import CreepState from "./creepState";
import {FLYWEIGHTS, botMemory} from "../../config/config";

export default class EnemyCreepState extends CreepState {
  public static apiType() {
    return Creep;
  }

  public static left(subject: Creep) {
    return (FLYWEIGHTS ? EnemyCreepState._left : new EnemyCreepState("EC") )
      .wrap(subject, botMemory()) as EnemyCreepState;
  }

  public static right(subject: Creep) {
    return (FLYWEIGHTS ? EnemyCreepState._right : new EnemyCreepState("EC") )
      .wrap(subject, botMemory()) as EnemyCreepState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? EnemyCreepState._vleft : new EnemyCreepState("EC") )
      .wrapRemote(id, botMemory()) as EnemyCreepState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? EnemyCreepState._vright : new EnemyCreepState("EC") )
      .wrapRemote(id, botMemory()) as EnemyCreepState;
  }

  protected static _left: EnemyCreepState = new EnemyCreepState("EnemyCreepStateLeft");
  protected static _right: EnemyCreepState = new EnemyCreepState("EnemyCreepStateRight");
  protected static _vleft: EnemyCreepState = new EnemyCreepState("EnemyCreepStateVirtualLeft");
  protected static _vright: EnemyCreepState = new EnemyCreepState("EnemyCreepStateVirtualRight");

  public className() {
    return "EnemyCreepState";
  }

  protected _accessAddress() {
    return ["enemies"];
  }

  protected _indexAddress() {
    return ["index", "enemies"];
  }

  protected _visionSource() {
    return false;
  }
}
