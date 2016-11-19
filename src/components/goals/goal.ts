import State from "../state/abstractState";

interface Goal<T> {
  getGoalId(): string|undefined;
  toString(): string;
  /**
   * perform operation assigned to achieve this goal
   */
  execute(state: State<any>, actor: T): void;
  /**
   * this goal can be immediately resolved in the next tick with a single task
   */
  canFinish(state: State<any>, actor: T): Task|undefined;
  /**
   * progress is immediately possible
   */
  canProgress(state: State<any>): boolean;
  //
  // /**
  //  * ticks to reach the next progress increment
  //  */
  // getProgressTicks(state: State): number;
  //
  // /**
  //  * magnitude of the next progress increment
  //  */
  // getProgressVelocity(state: State): number;
  //
  // /**
  //  * tasks calculated to depend on calculated progress
  //  */
  // getTasks(state: State): Task[];
}

export default Goal;
