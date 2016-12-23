import State from "./abstractState";
import {FLYWEIGHTS} from "../../config/config";
import {EnergyScore} from "../score/api/energyScore";

/**
 * HAR HAR HAR
 *
 * TODO SOON - cities are chains of structures which are 1-2 squares apart
 */
export default class CityState extends State<any> {
  public static apiType() {
    return OwnedStructure;
  }

  public static left(subject: OwnedStructure) {
    return (FLYWEIGHTS ? CityState._left : new CityState("SS") ).wrap(subject, State.rootMemory) as CityState;
  }

  public static right(subject: OwnedStructure) {
    return (FLYWEIGHTS ? CityState._right : new CityState("SS") ).wrap(subject, State.rootMemory) as CityState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? CityState._vleft : new CityState("SS") ).wrapRemote(id, State.rootMemory) as CityState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? CityState._vright : new CityState("SS") ).wrapRemote(id, State.rootMemory) as CityState;
  }

  private static _left: CityState = new CityState("CityStateLeft");
  private static _right: CityState = new CityState("CityStateRight");
  private static _vleft: CityState = new CityState("CityStateVirtualLeft");
  private static _vright: CityState = new CityState("CityStateVirtualRight");

  public score: EnergyScore;

  public className() {
    return "CityState";
  }

  protected _accessAddress() {
    return ["cities"];
  }

  protected _indexAddress() {
    return ["index", "cities"];
  }

  protected _visionSource() {
    return false;
  }

  protected init(rootMemory: any, callback?: LifecycleCallback<CityState>): boolean {
    if (super.init(rootMemory, callback)) {
      this.memory = _.defaultsDeep(this.memory, _.cloneDeep({
        members: [],
      }));

      if (callback !== undefined) {
        callback(this, State.LIFECYCLE_NEW);
      }

      this.memory.graph = State.graphs.buildGraph(this);

      return true;
    }

    return false;
  }
}
