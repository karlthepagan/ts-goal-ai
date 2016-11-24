import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";

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
    return "[" + this._name + " " + this._id + "]";
  }

  public delete() {
    super.delete();

    log.debug("delete", this);
  }

  protected _getId(subject: Source) {
    return subject.id;
  }

  protected init(): boolean {
    if (this._memory.reset) {
      this.delete();
    }

    if (!super.init()) {
      if (!this.isVirtual()) {
        const x = this.pos().x;
        const y = this.pos().y;
        this.subject().room.lookForAtArea(LOOK_TERRAIN,
            y - 1, x - 1, y + 1, x + 1,
          true);
        // TODO foreach
      }

      return false;
    }

    return true;
  }
}
