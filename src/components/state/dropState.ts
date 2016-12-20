import State from "./abstractState";
import {botMemory, FLYWEIGHTS} from "../../config/config";

export default class DropState extends State<Resource> {
  public static apiType() {
    return Resource;
  }

  public static left(subject: Resource) {
    return (FLYWEIGHTS ? DropState._left : new DropState("sS") ).wrap(subject, botMemory()) as DropState;
  }

  public static right(subject: Resource) {
    return (FLYWEIGHTS ? DropState._right : new DropState("sS") ).wrap(subject, botMemory()) as DropState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? DropState._vleft : new DropState("sS") ).wrapRemote(id, botMemory()) as DropState;
  }

  public static vright(id: string) { // TODO polymorphic
    return (FLYWEIGHTS ? DropState._vright : new DropState("sS") ).wrapRemote(id, botMemory()) as DropState;
  }

  private static _left: DropState = new DropState("DropStateLeft");
  private static _right: DropState = new DropState("DropStateRight");
  private static _vleft: DropState = new DropState("DropStateVirtualLeft");
  private static _vright: DropState = new DropState("DropStateVirtualRight");

  public className() {
    return "DropState";
  }

  protected _accessAddress() {
    return ["drops"];
  }

  protected _indexAddress() {
    return ["index", "drops"];
  }

  protected _visionSource() {
    return true;
  }

  protected init(rootMemory: any, callback?: LifecycleCallback<DropState>): boolean {
    if (super.init(rootMemory, callback)) {
      // if (!this.isRemote()) {
      //   const subject = this.subject();
      // }

      // drops don't touch
      delete this.memory.touch;

      // TODO distance to all sources? value calculations?

      if (callback !== undefined) {
        callback(this, State.LIFECYCLE_NEW);
      }

      return true;
    }

    return false;
  }
}
