import State from "../state/abstractState";
import Plan from "./plan";

/**
 * simplified goal interface, uses closures to spawn dependent goals
 * A actor type
 * R resource type
 * M state type
 */
interface Goal<A, R, M extends State<A>> {
  getGoalKey(): string;
  toString(): string;

  /**
   * construct state given actor
   *
   * @param subject
   */
  state(actor: A): M;

  /**
   * build global goals, examine rooms
   *
   * @returns rich plan with all possible candidates assigned
   */
  plan(state: M): Plan<R>[];

  /**
   * elect a winning plan
   *
   * @returns pruned plan structure
   */
  elect(state: M, plan: Plan<R>[]): Plan<R>;

  /**
   * execute plans
   *
   * state and world is modified
   *
   * @returns list of failed plan roots
   */
  execute(actor: A, state: M, plan: Plan<R>): Plan<R>[];

  /**
   * cleanup dead goals, plan for next cycle
   *
   * @returns resolution plan root
   */
  resolve(failures: Plan<R>[]): Plan<R>[]|any;
}
export default Goal;
