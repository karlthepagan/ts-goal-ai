import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
import * as F from "../functions";

export default class MineralState extends State<Mineral> {
  public static left(subject: Mineral) {
    return MineralState._left.wrap(subject, botMemory()) as MineralState;
  }

  public static right(subject: Mineral) {
    return MineralState._right.wrap(subject, botMemory()) as MineralState;
  }

  public static vleft(id: string) {
    return MineralState._vleft.virtual(id, botMemory()) as MineralState;
  }

  public static vright(id: string) {
    return MineralState._vright.virtual(id, botMemory()) as MineralState;
  }

  private static _left: MineralState = new MineralState("MineralStateLeft");
  private static _right: MineralState = new MineralState("MineralStateRight");
  private static _vleft: MineralState = new MineralState("MineralStateVirtualLeft");
  private static _vright: MineralState = new MineralState("MineralStateVirtualRight");

  protected _accessAddress = ["minerals"];
  protected _indexAddress = ["index", "minerals"];

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

  protected init(rootMemory: any): boolean {
    if (super.init(rootMemory)) {
      if (!this.isVirtual()) {
        const subject = this.subject();
        this._memory.nodes = F.findOpenPositions(subject.room, subject.pos, 1)
          .map(F.posToDirection(subject.pos));
      }

      return true;
    }

    return false;
  }
}
