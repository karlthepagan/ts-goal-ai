import ResourceState from "./abstractResourceState";
import * as Keys from "../keys";

export default class MineralState extends ResourceState<Mineral> {
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
      console.log("mineral");

      this.memory[Keys.INFO_MINERAL] = this.subject.mineralType;

      this.initTerrain();

      return true;
    }

    return false;
  }
}
