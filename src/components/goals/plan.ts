import Goal from "./goal";
import State from "../state/abstractState";
import List = _.List;

/**
 * G goal type
 * R resource type
 */
export default class Plan<R> {
  private _goal: Goal<any, R, State<any>>;
  private _resource: R;
  private _next: Plan<any>[] = [];

  constructor(goal: Goal<any, R, State<any>>, resource: R) {
    this._goal = goal;
    this._resource = resource;
  }

  public resource(): R {
    return this._resource;
  }

  public size(): number {
    return _.sum(this._next as List<Plan<any>>, (plan) => { return plan.size(); });
  }

  public add(dependency: Plan<any>) {
    this._next.push(dependency);
  }

  public addAll(dependencies: Plan<any>[]) {
    this._next.push(...dependencies);
  }
}
