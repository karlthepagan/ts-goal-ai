import State from "../state/abstractState";

/**
 * T actor type
 * R resource type
 * S state type
 */
interface Goal<T, R, S extends State<T>> {
  getGoalKey(): string;
  getGoalId(): string|undefined;
  toString(): string;
  /**
   * perform operation assigned to achieve this goal
   */
  execute(state: S, actor: T): void;
  /**
   * this goal can be immediately resolved in the next tick with a single task
   */
  canFinish(state: S, actor: T): Task|undefined;
  /**
   * progress is immediately possible
   */
  canProgress(state: S): boolean;

  // /**
  //  * ticks to reach the next progress increment
  //  */
  // getProgressTicks(state: State): number;
  //
  // /**
  //  * magnitude of the next progress increment
  //  */
  // getProgressVelocity(state: State): number;

  /**
   * calculate if an unallocated resource should be assigned to this goal
   */
  takeResource(state: S, actor: T): Task;

  /**
   * calculate if a resource should be stolen from another goal
   */
  stealResource(state: S, actor: T): Task;

  /**
   * tasks calculated to depend on calculated progress
   */
  getTasks(state: S, actor: T): Task[];
}

export default Goal;
