import State from "./abstractState";
import {FLYWEIGHTS} from "../../config/config";
import {ConstructionScore} from "../score/api/constructionScore";

export default class ConstructionState extends State<ConstructionSite> {
  public static apiType() {
    return ConstructionSite;
  }

  public static left(subject: ConstructionSite) {
    return (FLYWEIGHTS ? ConstructionState._left : new ConstructionState("TS") )
      .wrap(subject, State.rootMemory) as ConstructionState;
  }

  public static right(subject: ConstructionSite) {
    return (FLYWEIGHTS ? ConstructionState._right : new ConstructionState("TS") )
      .wrap(subject, State.rootMemory) as ConstructionState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? ConstructionState._vleft : new ConstructionState("TS") )
      .wrapRemote(id, State.rootMemory) as ConstructionState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? ConstructionState._vright : new ConstructionState("TS") )
      .wrapRemote(id, State.rootMemory) as ConstructionState;
  }

  private static _left: ConstructionState = new ConstructionState("ConstructionStateLeft");
  private static _right: ConstructionState = new ConstructionState("ConstructionStateRight");
  private static _vleft: ConstructionState = new ConstructionState("ConstructionStateVirtualLeft");
  private static _vright: ConstructionState = new ConstructionState("ConstructionStateVirtualRight");

  public score: ConstructionScore;

  public className() {
    return "ConstructionState";
  }

  protected _accessAddress() {
    return ["sites"];
  }

  protected _indexAddress() {
    return ["index", "sites"];
  }

  protected init(rootMemory: any, callback?: LifecycleCallback<ConstructionState>): boolean {
    // TODO memory mask, proxy?

    if (super.init(rootMemory, callback)) {

      // sites don't touch
      delete this.memory.touch;

      // TODO if callback, post immediately

      if (callback !== undefined) {
        callback(this, State.LIFECYCLE_NEW);
      }

      return true;
    }

    return false;
  }
}
