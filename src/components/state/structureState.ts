import State from "./abstractState";
import {botMemory, FLYWEIGHTS} from "../../config/config";

export default class StructureState<T extends OwnedStructure> extends State<T> {
  public static apiType() {
    return OwnedStructure;
  }

  public static left<X extends OwnedStructure>(subject: X) {
    return (FLYWEIGHTS ? StructureState._left : new StructureState<any>("sS") ).wrap(subject, botMemory()) as StructureState<X>;
  }

  public static right<X extends OwnedStructure>(subject: X) {
    return (FLYWEIGHTS ? StructureState._right : new StructureState<any>("sS") ).wrap(subject, botMemory()) as StructureState<X>;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? StructureState._vleft : new StructureState<any>("sS") ).wrapRemote(id, botMemory()) as StructureState<any>;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? StructureState._vright : new StructureState<any>("sS") ).wrapRemote(id, botMemory()) as StructureState<any>;
  }

  private static _left: StructureState<any> = new StructureState<any>("StructureStateLeft");
  private static _right: StructureState<any> = new StructureState<any>("StructureStateRight");
  private static _vleft: StructureState<any> = new StructureState<any>("StructureStateVirtualLeft");
  private static _vright: StructureState<any> = new StructureState<any>("StructureStateVirtualRight");

  public className() {
    return "StructureState";
  }

  protected _accessAddress() {
    return ["structures"];
  }

  protected _indexAddress() {
    return ["index", "structures"];
  }

  protected _visionSource() {
    return true;
  }

  protected init(rootMemory: any, callback?: InitCallback<State<T>>): boolean {
    if (super.init(rootMemory, callback)) {
      // if (!this.isRemote()) {
      //   const subject = this.subject();
      // }

      // TODO distance to all sources? value calculations?

      if (callback !== undefined) {
        callback(this);
      }

      return true;
    }

    return false;
  }
}
