import State from "./abstractState";
import {FLYWEIGHTS} from "../../config/config";
import {EnergyScore} from "../score/api/energyScore";

export default class StructureState<T extends OwnedStructure> extends State<T> {
  public static apiType() {
    return OwnedStructure;
  }

  public static left<X extends OwnedStructure>(subject: X) {
    return (FLYWEIGHTS ? StructureState._left : new StructureState<any>("sS") ).wrap(subject, State.rootMemory) as StructureState<X>;
  }

  public static right<X extends OwnedStructure>(subject: X) {
    return (FLYWEIGHTS ? StructureState._right : new StructureState<any>("sS") ).wrap(subject, State.rootMemory) as StructureState<X>;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? StructureState._vleft : new StructureState<any>("sS") ).wrapRemote(id, State.rootMemory) as StructureState<any>;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? StructureState._vright : new StructureState<any>("sS") ).wrapRemote(id, State.rootMemory) as StructureState<any>;
  }

  private static _left: StructureState<any> = new StructureState<any>("StructureStateLeft");
  private static _right: StructureState<any> = new StructureState<any>("StructureStateRight");
  private static _vleft: StructureState<any> = new StructureState<any>("StructureStateVirtualLeft");
  private static _vright: StructureState<any> = new StructureState<any>("StructureStateVirtualRight");

  public score: EnergyScore;

  public className() {
    return "StructureState";
  }

  public isFull(): boolean {
    const c: Container = this._subject as any;
    return _.chain(c.store).values().sum().value() === c.storeCapacity;
  }

  // TODO SOON - structure logical memory is part of a city
  protected _accessAddress() {
    return [LOOK_STRUCTURES];
  }

  protected _indexAddress() {
    return ["index", LOOK_STRUCTURES];
  }

  protected _visionSource() {
    return true;
  }

  protected init(rootMemory: any, callback?: LifecycleCallback<State<T>>): boolean {
    if (super.init(rootMemory, callback)) {
      // if (!this.isRemote()) {
      //   const subject = this.subject();
      // }

      // TODO distance to all sources? value calculations?

      if (callback !== undefined) {
        callback(this, State.LIFECYCLE_NEW);
      }

      this.memory.graph = State.graphs.buildGraph(this);

      return true;
    }

    return false;
  }
}
