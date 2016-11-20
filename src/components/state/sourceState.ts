import ResourceState from "./abstractResourceState";

export default class SourceState extends ResourceState<Source> {
  public static left(obj: Source): SourceState {
    return SourceState._left.wrap(obj, obj.getMemory()) as SourceState;
  }

  public static right(obj: Source): SourceState {
    return SourceState._right.wrap(obj, obj.getMemory()) as SourceState;
  }

  private static _left = new SourceState();
  private static _right = new SourceState();

  public init(): boolean {
    if (super.init()) {
      console.log("source");

      this.initTerrain();

      return true;
    }

    return false;
  }
}
