import State from "./abstractState";
import {botMemory, FLYWEIGHTS} from "../../config/config";

export default class ConstructionState extends State<ConstructionSite> {
  public static apiType() {
    return ConstructionSite;
  }

  public static left(subject: ConstructionSite) {
    return (FLYWEIGHTS ? ConstructionState._left : new ConstructionState("TS") )
      .wrap(subject, botMemory()) as ConstructionState;
  }

  public static right(subject: ConstructionSite) {
    return (FLYWEIGHTS ? ConstructionState._right : new ConstructionState("TS") )
      .wrap(subject, botMemory()) as ConstructionState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? ConstructionState._vleft : new ConstructionState("TS") )
      .wrapRemote(id, botMemory()) as ConstructionState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? ConstructionState._vright : new ConstructionState("TS") )
      .wrapRemote(id, botMemory()) as ConstructionState;
  }

  private static _left: ConstructionState = new ConstructionState("ConstructionStateLeft");
  private static _right: ConstructionState = new ConstructionState("ConstructionStateRight");
  private static _vleft: ConstructionState = new ConstructionState("ConstructionStateVirtualLeft");
  private static _vright: ConstructionState = new ConstructionState("ConstructionStateVirtualRight");

  public className() {
    return "ConstructionState";
  }

  protected _accessAddress() {
    return ["sites"];
  }

  protected _indexAddress() {
    return ["index", "sites"];
  }

  protected init(rootMemory: any): boolean {
    // TODO memory mask, proxy?

    if (super.init(rootMemory)) {

      return true;
    }

    return false;
  }
}
