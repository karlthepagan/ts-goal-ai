import {log} from "../support/log";
import State from "../state/abstractState";
import Joinpoint from "./joinpoint";
import InterceptorSpec from "./interceptorSpec";
import {AnyIS} from "./interceptorSpec";
import * as F from "../functions";
import {botMemory} from "../../config/config";
import ScheduleSpec from "./scheduledSpec";

type ClassSpec<T extends InterceptorSpec<any, any>> = { [methodName: string]: T[] };
export type SpecMap<T extends InterceptorSpec<any, any>> = { [className: string]: ClassSpec<T> };

interface EventMemory {
  /**
   * last dispatched event tick
   */
  lastTick: number;

  /**
   * Map of tick numbers to lists of InterceptorSpecs
   */
  timeline: { [key: string]: SpecMap<ScheduleSpec<any, any>> };
}

export default class InterceptorService implements ProxyHandler<State<any>> {
  private _interceptors: SpecMap<AnyIS>[] = [{}, {}, {}];
  private _dispatchTime: number|undefined;

  /**
   * the current time if called from inside the execution context
   */
  public dispatchTime(): number|undefined {
    return this._dispatchTime;
  }

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
    const interceptors = this.getInterceptors(jp, InterceptorSpec.AFTER_CALL);
    if (interceptors === undefined || interceptors.length === 0) {
      return jp.returnValue; // TODO apply within?
    }

    for (const interceptor of interceptors) {
      // TODO how to handle interceptor invoke decisions
      if (interceptor.test(jp) && interceptor.invoke(jp, this)) { // TODO circular reference?
        return jp.returnValue;
      }
    }

    return jp.returnValue; // TODO apply within?
  }

  public scheduleExec<A, B>(spec: ScheduleSpec<A, B>, jp: Joinpoint<A, B>) {
    debugger;
    jp = jp; // TODO need to put jp into spec?
    // jp is the context of the call which triggered us

    const scheduledTick = spec.relativeTime + F.elvis(this.dispatchTime(), Game.time);

    const taskList = F.expand(
      [ "timeline", scheduledTick, spec.definition.className, spec.definition.method],
      this.eventMemory(), true) as AnyIS[];

    const event = spec.clone();
    event.definition.objectId = jp.objectId;
    // TODO action must be resolved to a Named instance
    taskList.push(event);
  }

  /**
   * ticks may be delayed to allow for CPU conservation
   */
  public dispatchTick(time: number) {
    this._dispatchTime = time;
    let last = F.elvis(this.eventMemory().lastTick, time - 1);
    const timeline = F.expand([ "timeline" ], this.eventMemory());

    while (last++ < time) {
      let tick = timeline["" + last] as SpecMap<ScheduleSpec<any, any>>;
      if (tick !== undefined) {
        for (const className in tick) {
          const classSpec: ClassSpec<ScheduleSpec<any, any>> = tick[className];
          for (const methodName in classSpec) {
            const tasks: ScheduleSpec<any, any>[] = classSpec[methodName];
            for (const task of tasks) {
              debugger;
              // TODO attach ScheduledSpec.prototype into task
              // TODO replace State with generic named object registry to do callbacks that survive sharding
              const jp = task.definition;
              jp.target = State.vright(jp.className, jp.objectId as string); // TODO cache target?
              task.invoke(jp, this); // TODO NPE, really... prototype!
            }
          }
        }
      }

      this.eventMemory().lastTick = last;
      delete timeline["" + last];
    }
    this._dispatchTime = undefined;
  }

  // TODO mutate or simply return?
  protected beforeCall(jp: Joinpoint<any, any>): Function {
    // : BeforeCallback<any> = (className, objectId, func, result, args) => {
    const interceptors = this.getInterceptors(jp, InterceptorSpec.BEFORE_CALL);
    if (interceptors === undefined || interceptors.length === 0) {
      return jp.proceed(); // TODO apply within?
    }

    for (const interceptor of interceptors) {
      // TODO how to handle interceptor invoke decisions
      if (interceptor.test(jp) && interceptor.invoke(jp, this)) {
        return jp.returnValue;
      }
    }

    return jp.proceed(); // TODO apply within?
  }

  protected afterFail(jp: Joinpoint<any, any>): any {
    const interceptors = this.getInterceptors(jp, InterceptorSpec.AFTER_FAIL);
    if (interceptors === undefined || interceptors.length === 0) {
      throw jp.thrownException;
    }

    for (const interceptor of interceptors) {
      // TODO how to handle interceptor invoke decisions
      if (interceptor.test(jp) && interceptor.invoke(jp, this)) {
        return jp.returnValue;
      }
    }

    throw jp.thrownException;
  }

  protected getInterceptors(jp: Joinpoint<any, any>, callState: number): InterceptorSpec<any, any>[] {
    return F.expand([ callState, jp.className, jp.method ], this._interceptors, true) as AnyIS[];
  }

  // TODO method to look for the ticks remaining to and subject of a pending event

  protected eventMemory(): EventMemory {
    const mem = F.expand(["events"], botMemory()) as EventMemory;
    return mem;
  }
}
