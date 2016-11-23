import Goal from "./goal";
import State from "../state/abstractState";
import List = _.List;

/**
 * G goal type
 * R resource type
 */
export default class Plan<R> {
  public static ROOT: Plan<Game> = new Plan<Game>(undefined, undefined, Game);

  public static size(plans: Plan<any>[]|undefined): number {
    if (plans === undefined) {
      return 0;
    }
    return _.sum(plans as List<Plan<any>>, (plan) => { return plan.size(); });
  }

  private _parent: Plan<any>|undefined;
  private _goal: Goal<any, R, State<any>>;
  private _resource: R;
  private _next: Plan<any>[] = [];

  constructor(parent: Plan<any>|undefined, goal: Goal<any, R, State<any>>|undefined, resource: R) {
    this._parent = parent;
    this._goal = goal as Goal<any, R, State<any>>;
    this._resource = resource;
  }

  public isRoot(): boolean {
    return this._parent === undefined;
  }

  public resource(): R {
    return this._resource;
  }

  public goal(): Goal<any, R, State<any>> {
    return this._goal;
  }

  public size(): number {
    return 1 + Plan.size(this._next);
  }

  public add(dependency: Plan<any>) {
    this._next.push(dependency);
  }

  public addAll(dependencies: Plan<any>[]) {
    this._next.push(...dependencies);
  }

  public next(): Plan<any>[] {
    return this._next;
  }

  public parent(): Plan<any> {
    return this._parent as Plan<any>;
  }

  public commit(next: Plan<any>[]): Plan<R> {
    const committed = new Plan<R>(this._parent, this._goal, this._resource);
    committed._next = next;
    return committed;
  }

  public toString() {
    if (this.isRoot()) {
      return "*";
    } else {
      return this._goal + "." + this._parent;
    }
  }
}
