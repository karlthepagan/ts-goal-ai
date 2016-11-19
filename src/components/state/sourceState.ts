import State from "./abstractState";

export default class SourceState extends State<Source> {
  public static spawn(obj: Source): SourceState {
    return SourceState._inst.wrap(obj, obj.getMemory());
  }

  private static _inst = new SourceState();

  public init(): boolean {
    if (super.init()) {
      console.log("source");

      return true;
    }

    return false;
  }
}
