import State from "./abstractState";
import {botMemory, FLYWEIGHTS} from "../../config/config";

export default class StructureState extends State<OwnedStructure> {
  public static apiType() {
    return OwnedStructure;
  }

  public static left(subject: Spawn) {
    return (FLYWEIGHTS ? StructureState._left : new StructureState("sS") ).wrap(subject, botMemory()) as StructureState;
  }

  public static right(subject: Spawn) {
    return (FLYWEIGHTS ? StructureState._right : new StructureState("sS") ).wrap(subject, botMemory()) as StructureState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? StructureState._vleft : new StructureState("sS") ).wrapRemote(id, botMemory()) as StructureState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? StructureState._vright : new StructureState("sS") ).wrapRemote(id, botMemory()) as StructureState;
  }

  private static _left: StructureState = new StructureState("StructureStateLeft");
  private static _right: StructureState = new StructureState("StructureStateRight");
  private static _vleft: StructureState = new StructureState("StructureStateVirtualLeft");
  private static _vright: StructureState = new StructureState("StructureStateVirtualRight");

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
