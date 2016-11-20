import Goal from "../goals/goal";
import * as Keys from "../keys";
import * as Filters from "../filters";

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
    console.log("at ", this.subject, ":", JSON.stringify(this.memory));
    if (this.memory[Keys.SEEN] === undefined) {
      this.memory[Keys.SEEN] = 1;
      this.memory[Keys.LOCATION_POS] = Filters.posAsStr((this.subject as any).pos);
      this.memory[Keys.LOCATION_ROOM] = Filters.room(this.subject);

      this.memory[Keys.TASK_CANDIDATE_CREEPS] = {};
      this.memory[Keys.TASK_ASSIGNED_CREEPS] = {};

      return true;
    }

    return false;
  }

  public setFailure(goal: Goal<any>, actor: RoomObject, result: number) {
    console.log("Failed ", goal, result, actor);
  }
}
export default State;
