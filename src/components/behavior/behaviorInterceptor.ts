import {log} from "../support/log";
import State from "../state/abstractState";
import getType from "../types";

class Interceptor {
  public test(jp: Joinpoint<any>): boolean {
    jp = jp;
    return false;
  }

  public invoke(jp: Joinpoint<any>): boolean {
    jp = jp;
    return false;
  }
}

const BEFORE_CALL = 0;
const AFTER_CALL = 1;
const AFTER_FAIL = 2;

export default class BehaviorInterceptor implements ProxyHandler<State<any>> {
  public register(className: string, ) {
    className = className;
    log.debug("TODO behavior register"); // TODO register behavior
  }

  public get(target: State<any>, p: PropertyKey, receiver: any): any {
    receiver = receiver;

    const className = target.className();
    const objectId = target.getId();
    const method = p as string; // TODO really?

    if (target.resolve()) {
      const subject = target.subject();
      const value = subject[p];

      if (typeof value === "function") {
        const jp = new Joinpoint(className, objectId, method);
        jp.target = subject;

        // function proxy intercept the call
        return new Proxy(value, {
          apply: (callTarget: Function, thisArg: any, argArray: any[]): any => {
            thisArg = thisArg;
            jp.args = argArray;
            jp.proceedApply = callTarget;
            try {
              jp.returnValue = this.beforeCall(jp);
              return this.onCall(jp);
            } catch (err) {
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

  // TODO mutate or simply return?
  protected beforeCall(jp: Joinpoint<any>): Function {
    // : BeforeCallback<any> = (className, objectId, func, result, args) => {
    const interceptors = this.getInterceptors(jp, BEFORE_CALL);
    if (interceptors.length === 0) {
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

  protected onCall(jp: Joinpoint<any>): any {
    const interceptors = this.getInterceptors(jp, AFTER_CALL);
    if (interceptors.length === 0) {
      return jp.proceed; // TODO apply within?
    }

    for (const interceptor of interceptors) {
      // TODO how to handle interceptor invoke decisions
      if (interceptor.test(jp) && interceptor.invoke(jp)) {
        return jp.returnValue;
      }
    }

    return jp.returnValue; // TODO apply within?
  }

  protected afterFail(jp: Joinpoint<any>): any {
    const interceptors = this.getInterceptors(jp, AFTER_FAIL);
    if (interceptors.length === 0) {
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

  protected getInterceptors(jp: Joinpoint<any>, callState: number): Interceptor[] {
    jp = jp;
    callState = callState;
    // TODO look up interceptors
    return [];
  }

  protected resolve(className: string, objectId: string): State<any> {
    return getType(className).vright(objectId) as State<any>; // TODO startPool on transaction
  }
}
