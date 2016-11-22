import * as Keys from "../keys";
import * as Tasks from "../tasks";
import State from "./abstractState";

export default class MineralState extends State<Mineral> {
  public static left(obj: Mineral): MineralState {
    return MineralState._left.wrap(obj, obj.getMemory()) as MineralState;
  }

  public static right(obj: Mineral): MineralState {
    return MineralState._right.wrap(obj, obj.getMemory()) as MineralState;
  }

  private static _left = new MineralState();
  private static _right = new MineralState();

  public init() {
    if (super.init()) {
      this._memory[Keys.INFO_MINERAL] = this._subject.mineralType;

      this._memory[Keys.OBJECT_WORK_POSITIONS] = Tasks.findOpenPositions(this._subject.pos, 1);

      return true;
    }

    return false;
  }
}
