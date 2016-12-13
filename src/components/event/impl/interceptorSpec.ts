import EventSpec from "./eventSpec";
import Joinpoint from "../api/joinpoint";
import InterceptorService from "./interceptorService";
import getConstructor from "../../types";
import State from "../../state/abstractState";

export default class InterceptorSpec<I, T> extends EventSpec<I, T> implements ProxyHandler<Function> {
  public static fromConstructor(constructor: Constructor<State<any>>) {
    const is = new InterceptorSpec<any, any>();
    is.definition = new Joinpoint<any, any>();
    is.definition.className = constructor.name;
    is.definition.category = constructor.name;
    // jp.targetType is specified by the invocation
    // is.targetConstructor = constructor; // TODO needed?
    return is;
  }

  public static forProxyGet<S extends State<any>>(target: S, method: string) {
    const is = new InterceptorSpec<S, any>();
    is.definition = InterceptorSpec.joinpointFor(target, method);
    return is;
  }

  public static joinpointFor<X extends State<any>>(target: X, method: string) {
    const jp = Joinpoint.forInstance(target, target.getId());
    jp.method = method;
    jp.target = target.subject();
    jp.category = target.constructor.name; // constructor.name must match fromConstructor
    return jp;
  }

  constructor() {
    super();
  }

  // context gives us a handle on scheduler, which we use to register the event
  public invoke(jp: Joinpoint<any, any>, context: InterceptorService): boolean {
    context = context; // context used to schedule dependent actions

    debugger; // TODO REMOVE incerceptor invoke
    // special resolve case for intercepted objects, use override category as the target
    const wrapped = Object.create(jp);
    wrapped.resolve();
    // const ctor = getConstructor(wrapped.category as string) as any;
    // wrapped.target = ctor.vright(wrapped.objectId as string); // TODO silly convention
    const inst = this.resolve() as any;
    // TODO break this out and call in switch (for beforecall handling)
    if (this.targetBuilder !== undefined) {
      debugger; // TODO observe target builder
      inst[this.actionMethod](...this.targetBuilder(jp, ...this.resolveArgs(jp)));
    } else {
      inst[this.actionMethod](wrapped, ...this.actionArgs);
    }

    switch (this.callState) { // TODO abstraction
      case EventSpec.BEFORE_CALL:
        // TODO call intercept and process it
        break;

      case EventSpec.AFTER_CALL:
        break;

      case EventSpec.AFTER_FAIL:
        break;

      default:
        throw new Error("illegal callState: " + this.callState);
    }

    return false; // TODO return true indicates filtering, stop all JP processing
  }

  public clone<R extends EventSpec<I, T>>(into?: R): R {
    let covariant: InterceptorSpec<I, T> = into === undefined ? new InterceptorSpec<I, T>() : into as any;
    covariant = super.clone(covariant) as any;
    return covariant as any;
  }

  public unresolve() {
    super.unresolve();
  }

  protected resolve(): I {
    // TODO resolve the API call
    const ctor = getConstructor(this.instanceType) as any;
    return ctor.vright(this.instanceId) as any;
  }
}
