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

  private static _left: SpawnState = new SpawnState("SpawnStateLeft");
  private static _right: SpawnState = new SpawnState("SpawnStateRight");

  protected _accessAddress = ["spawns"];
  protected _indexAddress = ["index", "spawns"];

  public delete() {
    super.delete();

    delete this._memory.nodes;

    log.debug("delete", this);
  }

  protected _visionSource() {
    return true;
  }

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
      // if (!this.isVirtual()) {
      //   const subject = this.subject();
      // }

      // TODO distance to all sources? value calculations?

      return true;
    }

    return false;
  }
}
