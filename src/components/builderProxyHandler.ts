export abstract class StepHandler<V> {
  /*
   "Schedule" = ["WhenEvent"];
   "WhenEvent" = ["ActionSchedule"];
   "ActionSchedule" = ["ActionSchedule", "Schedule"]
   */
  // constructor(tree: any) {
  //
  // }

  public step(receiver: V, target: any, eventMethod: string, builders: any): V {
    target = target;
    receiver = receiver; // TODO should be pushing the state changes into target
    return builders[eventMethod] as any;
  }
}

/**
 * TODO - "T" is the factory impl
 */
export default class BuilderProxyHandler<T, V> implements ProxyHandler<T> {
  private _name: String;
  private _stepHandler: any;
  private _next: { [key: string]: BuilderProxyHandler<T, any> };

  constructor(name: string, stepHandler: any, next: BuilderProxyHandler<T, any>[], loop?: boolean) {
    this._name = name;
    this._stepHandler = stepHandler;
    next = loop ? next.concat(this) : next;
    this._next = _.chain(next).indexBy(i => i._name).value();
  }

  public get(target: T, eventMethod: string, receiver: V): BuilderProxyHandler<T, any> {
    return this._stepHandler.step(receiver, target, eventMethod, this._next);
  }
}
