import State from "../state/abstractState";
import Plan from "./plan";
import {goals} from "./goals";
import {GoalFactory} from "../filters";
import log from "../log";

function print(x: any): any {
  if (x === Game) {
    return "[Game]";
  }
  return x;
}

/**
 * simplified goal interface, uses closures to spawn dependent goals
 * A actor type
 * R resource type
 * M state type
 */
abstract class Goal<A, R, M extends State<A>> {
  constructor(plan: Plan<A>|undefined) {
    log(this, "goal with plan=", plan);
  }

  public abstract getGoalKey(): string;

  public toString(): string {
    return this.getGoalKey();
  }

  /**
   * construct state given actor
   *
   * @param subject
   */
  public abstract state(actor: A): M;

  /**
   * build goals, examine rooms.
   *
   * decide which goals are valid based on their initial conditions, prune invalid goals
   *
   * @returns rich plan with all possible candidates assigned
   */
  public plan(parent: Plan<A>, state: M): Plan<R>[] {
    if (state.isPaused() || this.isPaused()) {
      console.log("paused");
      return [];
    }

    const resources: R[] = this._identifyResources(state);
    const bannedGoals: string[] = [];

    log(this, "planning", resources.length, "resources", this._goalPriority().length, "goals");

    // naive, loop thru each resource and enumerate all the goals they could hit
    return resources.map((resource: R) => {
      const plan = new Plan<R>(parent, this, resource);

      nextGoal:
      for (const name of this._goalPriority()) {
        if (bannedGoals.indexOf(name) >= 0) {
          continue nextGoal;
        }

        const factory = this._goalFactory()[name];
        if (factory === undefined) {
          console.log("missing factory. goal=", name);
          bannedGoals.push(name);
          continue nextGoal;
        }

        const goal = factory(plan);
        if (goal === undefined) {
          console.log("no factory output. goal=", name, "resource=", resource);
          bannedGoals.push(name);
          continue nextGoal;
        }

        const resState = goal.state(resource);

        log(this, "created", resState, "from", print(resource));

        const childPlans = goal.plan(plan, resState);

        plan.addAll( childPlans );
      }

      return plan;
    });
  }

  /**
   * elect a winning plan
   *
   * allocate resources according to goals, order based on optimal velocity not just priority
   *
   * @returns pruned plan structure
   */
  public elect(state: M, plan: Plan<R>[]): Plan<R>[] {
    state = state;

    if (plan.length === 0) {
      console.log("no plan for", this);
      return [];
    }

    if (plan.length === 1) {
      let p = plan[0];
      let goal: Goal<any, R, State<any>> = p.goal();

      console.log(this, "simple election from", this, "to", goal);

      let next = goal.elect(goal.state(p.resource()), p.next());

      return [ p.commit(next) ];
    }

    console.log("complex election", this, ...plan);

    for (const p of plan) {
      let goal = p.goal();

      let next = goal.elect(goal.state(p.resource()), p.next());

      if (next.length === 0) {
        continue;
      }

      return [ p.commit(next) ];
    }

    // TODO sort plans by priority, eliminate plans with lower priority allocated resources
    return [];
  }

  /**
   * execute plans
   *
   * last-minute planning / replanning: interrupt goals steal workers based on velocity and priority
   *  - if this happens majority of plan will be rejected
   *
   * state and world is modified
   *
   * @returns list of failed plan roots
   */
  public execute(actor: A, plan: Plan<R>[]): Plan<R>[] {
    actor = actor;

    for (let task of plan) {
      let failures = task.goal().execute(task.resource(), task.next());
      // TODO package failures

      if (failures.length > 0) {
        console.log("failed goal=", task.goal().getGoalKey(), "res=", task.resource());
      }
    }

    return [];
  }

  /**
   * cleanup dead goals, plan for next cycle
   *
   * @returns resolution plan root
   */
  public resolve(parent: Plan<A>, failures: Plan<R>[]): Plan<R>[]|any {
    parent = parent;
    failures = failures;

    return undefined;
  }

  public isPaused(): boolean {
    return false;
  }

  // protected _buildCandidateActors(goalName: string, state: M): any[] {
  //   let factory = this._candidateActorFactory();
  //   let goalBuilder = factory[goalName];
  //   if (goalBuilder === undefined) {
  //     console.log("no builder goal=", goalName, "parentGoal=", this.getGoalKey());
  //     return [];
  //   }
  //
  //   let candidates: any[] = goalBuilder(state);
  //
  //   if (candidates === undefined) {
  //     console.log("no candidates goal=", goalName, "parendGoal=", this.getGoalKey());
  //     return [];
  //   }
  //
  //   return candidates;
  // }

  protected _goalPriority(): string[] {
    // TODO set goal priority
    return [];
  }

  protected _goalFactory(): GoalFactory<R> {
    return goals;
  }

  /**
   * given the incoming state, what resources can we look at?
   */
  protected _identifyResources(state: M): R[] {
    state = state;

    return [];
  }

  // /**
  //  * given the incoming state, output candidate actors used to boot up goals
  //  */
  // protected _candidateActorFactory(): CandidateFactory<M> {
  //   return emptyActors;
  // }
}
export default Goal;

// /**
//  * this goal can be immediately resolved in the next tick with a single task
//  */
// canFinish(state: S, actor: T): Task|undefined;
// /**
//  * progress is immediately possible
//  */
// canProgress(state: S): boolean;
//
// /**
//  * ticks to reach the next progress increment
//  */
// getProgressTicks(state: State): number;
//
// /**
//  * magnitude of the next progress increment
//  */
//
// getProgressVelocity(state: State): number;
// /**
//  * calculate if a resource should be stolen from another goal
//  */
// stealResource(state: S, actor: T): boolean;
