import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
// import * as F from "../functions";

export default class SpawnState extends State<Spawn> {
  public static left(subject: Spawn) {
    return SpawnState._left.wrap(subject, botMemory()) as SpawnState;
  }

  public static right(subject: Spawn) {
    return SpawnState._right.wrap(subject, botMemory()) as SpawnState;
  }

  public static vleft(id: string) {
    return SpawnState._vleft.virtual(id, botMemory()) as SpawnState;
  }

  public static vright(id: string) {
    return SpawnState._vright.virtual(id, botMemory()) as SpawnState;
  }

  private static _left: SpawnState = new SpawnState("SpawnStateLeft");
  private static _right: SpawnState = new SpawnState("SpawnStateRight");
  private static _vleft: SpawnState = new SpawnState("SpawnStateVirtualLeft");
  private static _vright: SpawnState = new SpawnState("SpawnStateVirtualRight");

  protected _accessAddress = ["spawns"];
  protected _indexAddress = ["index", "spawns"];

  public delete() {
    super.delete();

    delete this._memory.nodes;

    log.debug("delete", this);
  }

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
      // if (!this.isVirtual()) {
      //   const subject = this.subject();
      // }

      return true;
    }

    return false;
  }
}
