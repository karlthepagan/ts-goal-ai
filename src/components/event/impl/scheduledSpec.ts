import EventSpec from "./eventSpec";
import InterceptorService from "./interceptorService";
import Joinpoint from "../api/joinpoint";
import {getType} from "../../functions";
import Named from "../../named";
import AnonCache from "./anonCache";

/**
 * @param I - captured? joinpoint's instance type
 * @param T - captured? joinpoint's return value
 */
export default class ScheduleSpec<I, T> extends EventSpec<I, T> {
  public static fromTimeAndInstance(relativeTime: number, instance: Named) {
    // instance param becomes the parameter in my joinpoint
    if (isNaN(relativeTime)) {
      debugger; // illegal relativeTime
      throw new Error("illegal relativeTime");
    }
    if (relativeTime < 1) {
      throw new Error("illegal relativeTime=" + relativeTime);
    }

    // dst
    const is = new ScheduleSpec<any, any>();
    is.relativeTime = relativeTime; // schedule case is like a no-op followed by .wait(number)
    is.instanceType = getType(instance);
    is.instanceId = instance.getId();
    // src (same as dst??) TODO this could come from builder
    is.definition = new Joinpoint<any, any>();
    is.definition.className = is.instanceType;
    is.definition.method = "__events__";
    is.definition.objectId = is.instanceId; // TODO redundant?
    return is;
  }

  public relativeTime: number;

  constructor() {
    super();
    this.callState = EventSpec.AFTER_CALL;
  }

  // context gives us a handle on scheduler, which we use to register the event
  public invoke(jp: Joinpoint<any, any>, context: InterceptorService): boolean {
    if (this.targetBuilder !== undefined) {
      // TODO discarding targetBuilder args?
      context.scheduleExec(this, this.targetBuilder(jp)[0] as Joinpoint<any, any>);
    } else {
      context.scheduleExec(this, jp);
    }
    return false; // never stop execution for scheduled events
  }

  public clone<R extends EventSpec<I, T>>(into?: R): R {
    let covariant: ScheduleSpec<I, T> = into === undefined ? new ScheduleSpec<I, T>() : into as any;
    covariant = super.clone(covariant) as any;
    covariant.relativeTime = this.relativeTime;
    return covariant as any;
  }

  public unresolve() {
    this.targetBuilderRef = AnonCache.instance.allocate(this.targetBuilder);

    super.unresolve();
    // keep relative time, in the case of "wait" the schedule trigger occurs after another event
  }
}
