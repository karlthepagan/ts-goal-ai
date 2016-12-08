import InterceptorSpec from "./interceptorSpec";
import InterceptorService from "./interceptorService";
import Joinpoint from "../joinpoint";

/**
 * @param I - captured? joinpoint's instance type
 * @param T - captured? joinpoint's return value
 */
export default class ScheduleSpec<I, T> extends InterceptorSpec<I, T> {
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
