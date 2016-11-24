import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
import * as F from "../functions";

export default class SourceState extends State<Source> {
  public static left(subject: Source) {
    return SourceState._left.wrap(subject, botMemory()) as SourceState;
  }

  public static right(subject: Source) {
    return SourceState._right.wrap(subject, botMemory()) as SourceState;
  }

  private static _left: SourceState = new SourceState("SourceStateLeft");
  private static _right: SourceState = new SourceState("SourceStateRight");

  protected _memAddress = ["sources"];

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
