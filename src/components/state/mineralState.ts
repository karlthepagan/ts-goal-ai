import State from "./abstractState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";

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

    log.debug("delete", this);
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
