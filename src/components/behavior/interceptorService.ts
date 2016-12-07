import {log} from "../support/log";
import State from "../state/abstractState";
import Joinpoint from "../event/joinpoint";
import InterceptorSpec from "../event/interceptorSpec";
import {AnyIS} from "../event/interceptorSpec";
import * as F from "../functions";
import {AFTER_CALL, AFTER_FAIL, BEFORE_CALL} from "../event/interceptorSpec";

type ClassSpecs = { [methodName: string]: AnyIS[] };
export type SpecMap = { [className: string]: ClassSpecs };

export default class InterceptorService implements ProxyHandler<State<any>> {
  private _interceptors: SpecMap[] = [{}, {}, {}];

  /**
   * @param name - descirbes the builder
   * @param spec - test input was like [[createCreep],[],[ofAll],[],[apply],[function]]
   */
  public register(name: string, spec: AnyIS) {
    if (!spec.isValid()) {
      throw new Error("invalid spec=" + JSON.stringify(spec));
    }
    log.debug("register", name, spec.callState, spec.definition.className, spec.definition.method);
    const specs = F.expand(
      [ spec.callState, spec.definition.className, spec.definition.method ],
      this._interceptors, true) as AnyIS[];
    specs.push(spec);
  }

  public get(target: State<any>, p: PropertyKey, receiver: any): any {
    receiver = receiver;

    const className = target.constructor.name;
    const objectId = target.getId();
    const method = p as string; // TODO really?

    if (target.resolve()) {
      const subject = target.subject();
      const value = subject[p];

      if (typeof value === "function") {
        const jp = new Joinpoint<any, any>(className, method, objectId);
        jp.target = subject;

        // function proxy intercept the call
        return new Proxy(value, {
          apply: (callTarget: Function, thisArg: any, argArray: any[]): any => {
            thisArg = thisArg;
            jp.args = argArray;
            jp.proceedApply = callTarget;
            try {
              jp.returnValue = this.beforeCall(jp);
              return this.dispatch(jp);
            } catch (err) {
              log.trace(err); // TODO remove trace
              jp.thrownException = err;
              return this.afterFail(jp);
            }
          },
        });
      } else {
        // TODO value proxy?
        return value;
      }
    } else {
      // TODO queue unresolvable? return no-op
      throw Error("cannot resolve class=" + target.className() + " id=" + target.getId() + " for get=" + method);
    }
  }

  public dispatch(jp: Joinpoint<any, any>): any {
    const interceptors = this.getInterceptors(jp, AFTER_CALL);
    if (interceptors === undefined || interceptors.length === 0) {
      return jp.returnValue; // TODO apply within?
    }

    for (const interceptor of interceptors) {
      // TODO how to handle interceptor invoke decisions
      if (interceptor.test(jp) && interceptor.invoke(jp)) {
        return jp.returnValue;
      }
    }

    return jp.returnValue; // TODO apply within?
  }

  // TODO mutate or simply return?
  protected beforeCall(jp: Joinpoint<any, any>): Function {
    // : BeforeCallback<any> = (className, objectId, func, result, args) => {
    const interceptors = this.getInterceptors(jp, BEFORE_CALL);
    if (interceptors === undefined || interceptors.length === 0) {
      return jp.proceed(); // TODO apply within?
    }

    for (const interceptor of interceptors) {
      // TODO how to handle interceptor invoke decisions
      if (interceptor.test(jp) && interceptor.invoke(jp)) {
        return jp.returnValue;
      }
    }

    return jp.proceed(); // TODO apply within?
  }

  protected afterFail(jp: Joinpoint<any, any>): any {
    const interceptors = this.getInterceptors(jp, AFTER_FAIL);
    if (interceptors === undefined || interceptors.length === 0) {
      throw jp.thrownException;
    }

    for (const interceptor of interceptors) {
      // TODO how to handle interceptor invoke decisions
      if (interceptor.test(jp) && interceptor.invoke(jp)) {
        return jp.returnValue;
      }
    }

    throw jp.thrownException;
  }

  protected getInterceptors(jp: Joinpoint<any, any>, callState: number): InterceptorSpec<any, any>[] {
    return F.expand([ callState, jp.className, jp.method ], this._interceptors, true) as AnyIS[];
  }
}
