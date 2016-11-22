import State from "./abstractState";

export default class CreepState extends State<Creep> {
  public static left(obj: Creep): CreepState {
    return CreepState._left.wrap(obj, obj.getMemory()) as CreepState;
  }

  public static right(obj: Creep): CreepState {
    return CreepState._right.wrap(obj, obj.getMemory()) as CreepState;
  }

  private static _left = new CreepState();
  private static _right = new CreepState();

  public init(): boolean {
    if (super.init()) {

      return true;
    }

    return false;
  }
}
