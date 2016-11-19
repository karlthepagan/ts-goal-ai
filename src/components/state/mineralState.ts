import State from "./abstractState";

export default class MineralState extends State<Mineral> {
  public static spawn(obj: Mineral): MineralState {
    return MineralState._inst.wrap(obj, obj.getMemory());
  }

  private static _inst = new MineralState();

  public init() {
    if (super.init()) {
      console.log("mineral");

      return true;
    }

    return false;
  }
}
