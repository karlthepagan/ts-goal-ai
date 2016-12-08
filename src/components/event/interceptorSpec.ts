import Joinpoint from "./joinpoint";
import {OnIntercept} from "./index";
import InterceptorService from "../behavior/interceptorService";

export const BEFORE_CALL = 0; // TODO enum?
export const AFTER_CALL = 1;
export const AFTER_FAIL = 2;

export type AnyIS = InterceptorSpec<any, any>;

class InterceptorSpec<I, T> {
  public definition: Joinpoint<I, T>;
  public targetConstructor?: Constructor<I>;
  public callState: number;
  public action: OnIntercept<I, T>; // only valid for immediate execution, doesn't survive sharding
  public actionArgs: any[] = [];

  public isValid(): boolean {
    return !(this.definition === undefined || this.callState === undefined || this.action === undefined);
  }

  public test(jp: Joinpoint<any, any>): boolean {
    jp = jp;
    return true; // TODO return false on filter block
  }

  public invoke(jp: Joinpoint<any, any>, context: InterceptorService): boolean {
    jp = jp; // jp is the actual call invocation
    context = context; // context used to schedule dependent actions
    this.action(jp, ...this.actionArgs); // TODO break this out and call in switch?

    switch (this.callState) { // TODO abstraction
      case BEFORE_CALL:
        // TODO call intercept and process it
        break;

      case AFTER_CALL:
        break;

      case AFTER_FAIL:
        break;

      default:
        throw new Error("illegal callState: " + this.callState);
    }

    return false; // TODO return true indicates filtering, stop all JP processing
  }

  public clone<R extends InterceptorSpec<I, T>>(into?: R): R {
    if (into === undefined) {
      into = new InterceptorSpec<I, T>() as R;
    }
    into.action = this.action;
    into.actionArgs = this.actionArgs;
    into.callState = this.callState;
    into.definition = this.definition;
    into.targetConstructor = this.targetConstructor;
    return into;
  }
}

/**
 * @param I - captured? joinpoint's instance type
 * @param T - captured? joinpoint's return value
 */
export class ScheduleSpec<I, T> extends InterceptorSpec<I, T> {
  public relativeTime: number;
  // public childInterceptor; // TODO this will be mutated as it travels down the builder chain

  // context gives us a handle on scheduler, which we use to register the event
  public invoke(jp: Joinpoint<any, any>, context: InterceptorService): boolean {
    context.scheduleExec(this, jp);
    return false; // never stop execution for scheduled events
  }

  public clone<R extends InterceptorSpec<I, T>>(into?: R): R {
    let covariant: ScheduleSpec<I, T> = into === undefined ? new ScheduleSpec<I, T>() : into as any;
    covariant = super.clone(covariant) as any;
    covariant.relativeTime = this.relativeTime;
    return covariant as any;
  }
}

export default InterceptorSpec;
