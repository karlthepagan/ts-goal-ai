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

  public static vleft(id: string) {
    return SourceState._vleft.virtual(id, botMemory()) as SourceState;
  }

  public static vright(id: string) {
    return SourceState._vright.virtual(id, botMemory()) as SourceState;
  }

  private static _left: SourceState = new SourceState("SourceStateLeft");
  private static _right: SourceState = new SourceState("SourceStateRight");
  private static _vleft: SourceState = new SourceState("SourceStateVirtualLeft");
  private static _vright: SourceState = new SourceState("SourceStateVirtualRight");

  protected _accessAddress = ["sources"];
  protected _indexAddress = ["index", "sources"];

  public delete() {
    super.delete();

    delete this._memory.nodes;

    log.debug("delete", this);
  }

  public nodeIds(): number[] {
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
