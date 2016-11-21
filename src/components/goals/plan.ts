import Goal from "./goal";

/**
 * G goal type
 * R resource type
 */
class Plan<R> {
  private _goal: Goal<any>;
  private _resource: R;
  private _next: Plan<any>[] = [];

  constructor(goal: Goal<any>, resource: R) {
    this._goal = goal;
    this._resource = resource;
  }

  public size(): number {
    return _.sum(this._next, (plan) => { plan.size(); });
  }

  public add(dependency: Plan<any, any>) {
    this._next.push(dependency);
  }
}
export default Plan;
