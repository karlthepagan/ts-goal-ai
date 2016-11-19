import Goal from "../goals/goal";

/**
 * Flyweight objects which wrap memory and object to calculate state
 */
abstract class State<T> {
  protected subject: T;
  protected memory: any;

  public wrap(subject: T, memory: any): State<T> {
    this.subject = subject;
    this.memory = memory;

    this.init();

    return this;
  }

  public init(): boolean {
    console.log("at ", this.subject);
    if (this.memory.seen === undefined) {
      this.memory.seen = 1;

      return true;
    }

    return false;
  }

  public setFailure(goal: Goal<any>, actor: RoomObject, result: number) {
    console.log("Failed ", goal, result, actor);
  }
}
export default State;
