import State from "./abstractState";
import {botMemory, FLYWEIGHTS} from "../../config/config";

// TODO DEPRECATED
export default class SpawnState extends State<Spawn> { // TODO extends StructureState
  public static apiType() {
    return Spawn;
  }

  public static left(subject: Spawn) {
    return (FLYWEIGHTS ? SpawnState._left : new SpawnState("SS") ).wrap(subject, botMemory()) as SpawnState;
  }

  public static right(subject: Spawn) {
    return (FLYWEIGHTS ? SpawnState._right : new SpawnState("SS") ).wrap(subject, botMemory()) as SpawnState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? SpawnState._vleft : new SpawnState("SS") ).wrapRemote(id, botMemory()) as SpawnState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? SpawnState._vright : new SpawnState("SS") ).wrapRemote(id, botMemory()) as SpawnState;
  }

  private static _left: SpawnState = new SpawnState("SpawnStateLeft");
  private static _right: SpawnState = new SpawnState("SpawnStateRight");
  private static _vleft: SpawnState = new SpawnState("SpawnStateVirtualLeft");
  private static _vright: SpawnState = new SpawnState("SpawnStateVirtualRight");

  public className() {
    return STRUCTURE_SPAWN;
  }

  protected _accessAddress() {
    return ["spawns"];
  }

  protected _indexAddress() {
    return ["index", "spawns"];
  }

  protected _visionSource() {
    return true;
  }

  // TODO getId?
  // protected _getId(subject: Spawn) {
  //   return subject.id;
  // }

  protected init(rootMemory: any, callback?: InitCallback<SpawnState>): boolean {
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
