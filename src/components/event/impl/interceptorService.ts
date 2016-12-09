import {log} from "../../support/log";
import State from "../../state/abstractState";
import Joinpoint from "../api/joinpoint";
import InterceptorSpec from "./interceptorSpec";
import {AnyIS} from "./interceptorSpec";
import * as F from "../../functions";
import {botMemory} from "../../../config/config";
import ScheduleSpec from "./scheduledSpec";
import Named from "../../named";
import {interceptorService} from "../behaviorContext";

type ClassSpec<T extends InterceptorSpec<any, any>> = { [methodName: string]: T[] };
export type SpecMap<T extends InterceptorSpec<any, any>> = { [className: string]: ClassSpec<T> };

interface EventMemory {
  /**
   * last dispatched event tick
   */
  lastTick: number;

  /**
   * Map of tick numbers to lists of ScheduleSpecs
   *
   * TODO discard scheduledTick info and make this an InterceptorSpec?
   */
  timeline: { [key: string]: SpecMap<ScheduleSpec<any, any>> };
}

export default class InterceptorService implements ProxyHandler<State<any>>, Named {
  public static vright(id: string) {
    id = id;
    return interceptorService; // TODO singleton
  }

  private _interceptors: SpecMap<AnyIS>[] = [{}, {}, {}];
  private _dispatchTime: number|undefined;

  public className(): string {
    return "InterceptorService";
  }

  public getId(): string {
    return "global";
  }
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
    if (!spec.isRegisterable()) {
      debugger; // invalid spec
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

  // TODO should InterspectorSpec pollute this API?
  public triggerBehaviors(jp: Joinpoint<any, any>, eventName: string) {
    jp = jp;
    log.debug("trigger behaviors event=", eventName);
    // construct event
    const event = new Joinpoint<any, any>("__events__", eventName, "?"); // TODO objectId for definition?
    // jp.target; // TODO this is the event source, inject it into event?
    event.returnValue = jp.returnValue;
    event.args = jp.args;

    this.dispatch(event);
  }

  public dispatch(jp: Joinpoint<any, any>): any {
    if (!jp.isReturned()) {
      debugger; // jp not captured before call
    }
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

  /**
   * @param spec
   * @param jp method invocation triggering this schedule spec
   */
  public scheduleExec<A, B>(spec: ScheduleSpec<A, B>, jp?: Joinpoint<A, B>) {
    const scheduledTick = spec.relativeTime + F.elvis(this.dispatchTime(), Game.time);

    const taskList = F.expand(
      [ "timeline", scheduledTick, spec.definition.className, spec.definition.method],
      this.eventMemory(), true) as AnyIS[];

    const event = spec.clone();
    if (jp === undefined) {
      // this is a directly scheduled event on a specific instance (set upstream of this method)
      // TODO definition needed? (yes because everything wants jp defined in the loops)
      event.definition = new Joinpoint<A, B>("__events__", "custom", "?");
      debugger; // TODO check splice here?
    } else {
      // jp is the context of the call which triggered us
      event.definition.objectId = jp.objectId;
      event.definition.args = jp.args;
      event.definition.returnValue = jp.returnValue;
    }
    // TODO delete scheduledTick?
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
      let tick = timeline["" + last] as SpecMap<AnyIS>;
      if (tick !== undefined) {
        for (const className in tick) {
          const classSpec: ClassSpec<AnyIS> = tick[className];
          for (const methodName in classSpec) {
            const tasks: AnyIS[] = classSpec[methodName];
            for (const task of tasks) {
              // TODO attach ScheduledSpec.prototype into task
              // TODO replace State with generic named object registry to do callbacks that survive sharding
              const jp = task.definition;
              jp.target = State.vright(jp.className, jp.objectId as string);
              // InterceptorSpec invoke is immediate execution
              // ScheduleSpec invoke will re-schedule
              Object.setPrototypeOf(task, InterceptorSpec.prototype); // TODO does this bind?
              if (!task.isInvokable()) {
                debugger; // task not invokable
                throw new Error("cannot invoke");
              }
              task.invoke(jp, this);
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
    if (!jp.isCaptured()) {
      debugger; // jp not captured before call
    }
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
    if (!jp.isFailed()) {
      debugger; // jp not captured before call
    }
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
