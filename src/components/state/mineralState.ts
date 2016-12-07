import State from "./abstractState";
import {log} from "../support/log";
import {botMemory, FLYWEIGHTS} from "../../config/config";
import * as F from "../functions";

export default class MineralState extends State<Mineral> {
  public static apiType() {
    return undefined; // TODO Mineral; not a constructor
  }

  public static left(subject: Mineral) {
    return (FLYWEIGHTS ? MineralState._left : new MineralState("MS") ).wrap(subject, botMemory()) as MineralState;
  }

  public static right(subject: Mineral) {
    return (FLYWEIGHTS ? MineralState._right : new MineralState("MS") ).wrap(subject, botMemory()) as MineralState;
  }

  public static vleft(id: string) {
    return (FLYWEIGHTS ? MineralState._vleft : new MineralState("MS") ).wrapRemote(id, botMemory()) as MineralState;
  }

  public static vright(id: string) {
    return (FLYWEIGHTS ? MineralState._vright : new MineralState("MS") ).wrapRemote(id, botMemory()) as MineralState;
  }

  private static _left: MineralState = new MineralState("MineralStateLeft");
  private static _right: MineralState = new MineralState("MineralStateRight");
  private static _vleft: MineralState = new MineralState("MineralStateVirtualLeft");
  private static _vright: MineralState = new MineralState("MineralStateVirtualRight");

  public className() {
    return "MineralState";
  }

  public delete() {
    super.delete();

    delete this._memory.nodes;

    log.debug("delete", this);
  }

  public nodeDirs(): number[] {
    return this._memory.nodes as number[];
  }

  public nodesAsPos(): RoomPosition[] {
    return (this._memory.nodes as number[]).map(F.dirToPosition(this.subject().pos));
  }

  protected _accessAddress() {
    return ["minerals"];
  }

  protected _indexAddress() {
    return ["index", "minerals"];
  }

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
      if (!this.isRemote()) {
        const subject = this.subject();
        this._memory.nodes = F.findOpenPositions(subject.room, subject.pos, 1)
          .map(F.posToDirection(subject.pos));
      }

      return true;
    }

    return false;
  }
}
