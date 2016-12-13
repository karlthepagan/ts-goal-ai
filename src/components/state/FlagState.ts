import State from "./abstractState";
import {botMemory, FLYWEIGHTS} from "../../config/config";

export default class FlagState extends State<Flag> {
  public static apiType() {
    return Flag;
  }

  public static left(subject: Flag) {
    return (FLYWEIGHTS ? FlagState._left : new FlagState("FS") ).wrap(subject, botMemory()) as FlagState;
  }

  public static right(subject: Flag) {
    return (FLYWEIGHTS ? FlagState._right : new FlagState("FS") ).wrap(subject, botMemory()) as FlagState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? FlagState._vleft : new FlagState("FS") ).wrapRemote(id, botMemory()) as FlagState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? FlagState._vright : new FlagState("FS") ).wrapRemote(id, botMemory()) as FlagState;
  }

  private static _left: FlagState = new FlagState("FlagStateLeft");
  private static _right: FlagState = new FlagState("FlagStateRight");
  private static _vleft: FlagState = new FlagState("FlagStateVirtualLeft");
  private static _vright: FlagState = new FlagState("FlagStateVirtualRight");

  public className() {
    return "FlagState";
  }

  protected _accessAddress() {
    return ["flags"];
  }

  protected _indexAddress() {
    return ["index", "flags"];
  }

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
      // TODO distance to all sources? value calculations?
      this.subject().color;

      return true;
    }

    return false;
  }
}
