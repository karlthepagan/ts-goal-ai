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

  private static _left: MineralState = new MineralState("MineralStateLeft");
  private static _right: MineralState = new MineralState("MineralStateRight");

  protected _memAddress = ["minerals"];

  public toString() {
    return "[" + this._name + " " + this.pos() + "]";
  }

  public delete() {
    super.delete();

    delete this._memory.nodes;

    log.debug("delete", this);
  }

  public nodeIds(): string[] {
    return (this._memory.nodes as number[]).map((n) => { return "" + n; });
  }

  public nodesAsPos(): RoomPosition[] {
    return (this._memory.nodes as number[]).map(F.dirToPosition(this.subject().pos));
  }

  protected _getId(subject: Mineral) {
    return subject.id;
  }

  protected init(): boolean {
    if (this._memory.reset) {
      this.delete();
    }

    if (!super.init()) {
      if (!this.isVirtual()) {
        const subject = this.subject();
        this._memory.nodes = F.findOpenPositions(subject.room, subject.pos, 1)
          .map(F.posToDirection(subject.pos));
      }

      return false;
    }

    return true;
  }
}
