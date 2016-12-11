import EventSpec from "./eventSpec";
import Joinpoint from "../api/joinpoint";
import InterceptorService from "./interceptorService";
import getConstructor from "../../types";
import State from "../../state/abstractState";
import {getType} from "../../functions";

export default class InterceptorSpec<I, T> extends EventSpec<I, T> implements ProxyHandler<Function> {
  public static fromConstructor(constructor: Constructor<State<any>>) {
    const is = new InterceptorSpec<any, any>();
    is.definition = new Joinpoint<any, any>(constructor.name, "?");
    // jp.targetType is specified by the invocation
    is.definition.category = constructor.name;
    // is.targetConstructor = constructor; // TODO needed?
    return is;
  }

  public static forProxyGet<S>(target: State<S>, method: string) {
    const is = new InterceptorSpec<S, any>();
    is.definition = InterceptorSpec.joinpointFor(target, method);
  }

  public static joinpointFor(target: State<any>, method: string) {
    const objectId = target.getId();
    const subject = target.subject();
    const jp = new Joinpoint<any, any>(getType(subject), method, objectId);
    jp.target = subject;
    jp.category = target.constructor.name; // constructor.name must match fromConstructor
    return jp;
  }

  constructor() {
    super();
  }

  // context gives us a handle on scheduler, which we use to register the event
  public invoke(jp: Joinpoint<any, any>, context: InterceptorService): boolean {
    jp = jp; // jp is the actual call invocation
    context = context; // context used to schedule dependent actions
    const inst = this.resolve() as any;

    // TODO break this out and call in switch (for beforecall handling)
    inst[this.actionMethod](jp, ...this.actionArgs);

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
