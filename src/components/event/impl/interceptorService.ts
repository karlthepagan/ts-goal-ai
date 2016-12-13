import {log} from "../../support/log";
import State from "../../state/abstractState";
import Joinpoint from "../api/joinpoint";
import EventSpec from "./eventSpec";
import {AnyEvent} from "./eventSpec";
import * as F from "../../functions";
import {botMemory} from "../../../config/config";
import ScheduleSpec from "./scheduledSpec";
import Named from "../../named";
import {interceptorService} from "../behaviorContext";
import InterceptorSpec from "./interceptorSpec";
import {OnBuildTarget} from "../api/index";

type ClassSpec<T extends EventSpec<any, any>> = { [methodName: string]: T[] };
export type SpecMap<T extends EventSpec<any, any>> = { [className: string]: ClassSpec<T> };

interface EventMemory {
  /**
   * last dispatched event tick
   */
  lastTick: number;

  /**
   * Map of tick numbers to lists of ScheduleSpecs
   */
  timeline: { [tick: string]: SpecMap<ScheduleSpec<any, any>> };

  // TODO method to look for the ticks remaining to and subject of a pending event
  // priorityQueue: { [classAndMethodName: string]: ScheduleSpec<any, any>[]};
}

export default class InterceptorService implements ProxyHandler<State<any>>, Named {
  public static vright(id: string) {
    id = id;
    return interceptorService; // TODO remove singleton, move to CDI
  }

  private _interceptors: SpecMap<AnyEvent>[] = [{}, {}, {}];
  private _dispatchTime: number|undefined;

  public className(): string {
    return "InterceptorService";
  }

  public getId(): string {
    return "global"; // TODO CDI
  }
  /**
   * the current time if called from inside the execution context
   */
  public dispatchTime(): number|undefined {
    return this._dispatchTime;
  }

  /**
   * @param name - descirbes the builder
   * @param spec - test input was like [[createCreep],[],[ofAll],[],[advice],[function]]
   */
  public register(name: string, spec: AnyEvent) {
    name = name;
    if (!spec.isRegisterable()) {
      debugger; // invalid spec
      throw new Error("invalid spec=" + JSON.stringify(spec));
    }
    // log.debug("register", name, spec.callState, spec.definition.getMatchingClass(), spec.definition.method);
    const specs = F.expand(
      [ spec.callState, spec.definition.getMatchingClass(), spec.definition.method ],
      this._interceptors, true) as AnyEvent[];
    specs.push(spec);
  }

  public get(target: State<any>, p: PropertyKey, receiver: any): any {
    // TODO this might slow us down
    const commands = botMemory() as Commands;
    if (commands.debugInterceptor) {
      debugger; // Commands.debugKernel
    }

    receiver = receiver;
    if (target.resolve()) {
      const subject = target.subject();
      const value = subject[p];

      if (typeof value === "function") {
        const jp = InterceptorSpec.joinpointFor(target, p as string);

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
              log.trace(err); // TODO remove trace?
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
      throw Error("cannot resolve class=" + target.className() + " id=" + target.getId() + " for get=" + p.toString());
    }
  }

  public triggerBehaviors(jp: Joinpoint<any, any>, eventName: string, targetBuilder?: OnBuildTarget<any, any>) {
    if (targetBuilder === null) {
      throw new Error("fireEvent cannot specify targetBuilder after a wait condition"); // TODO AnonCache targetBuilders
    }

    // TODO messy, no array resturn destructuring
    const eventTemplate = targetBuilder === undefined ? jp : targetBuilder(jp)[0] as Joinpoint<any, any>;

    // TODO discarding targetBuilder information about args (other use-cases will restructure args for callbacks)
    // see ScheduleSpec.invoke
    const event = Joinpoint.newEvent(eventName, eventTemplate);

    this.dispatch(event);
  }

  public dispatch(jp: Joinpoint<any, any>): any {
    if (!jp.isReturned()) {
      debugger; // jp not captured before call
    }
    const interceptors = this.getInterceptors(jp, EventSpec.AFTER_CALL);
    if (interceptors === undefined || interceptors.length === 0) {
      return jp.returnValue;
    }

    const commands = botMemory() as Commands;
    if (commands.debugEvents) {
      debugger; // Commands.debugEvents
    }

    const unwrapped = Object.create(jp);
    unwrapped.resolve();
    for (let i = 0; i < interceptors.length; i++) {
      const interceptor = interceptors[i];
      if (interceptor.test(unwrapped) && interceptor.invoke(unwrapped, this)) {
        return unwrapped.returnValue;
      }
    }

    return unwrapped.returnValue;
  }

  /**
   * @param jp method invocation triggering this schedule spec
   */
  public scheduleExec<A, B>(spec: ScheduleSpec<A, B>, jp?: Joinpoint<A, B>) {
    const event = spec.clone() as ScheduleSpec<A, B>;
    // this is a directly scheduled event on a specific instance (which is set upstream of this method)
    if (jp !== undefined) {
      // jp is the context of the call which triggered us
      event.definition.objectId = jp.objectId;
      event.definition.args = jp.args;
      event.definition.returnValue = jp.returnValue;
    }
    event.unresolve();
    jp = event.definition;

    const scheduledTick = spec.relativeTime + F.elvis(this.dispatchTime(), Game.time);
    if (isNaN(scheduledTick)) {
      throw new Error("NaN schedule time" + jp.getMatchingClass() + "[" + jp.objectId + "]" + "." + jp.method
        + "(" + JSON.stringify(jp.args) + ")");
    }

    const taskList = F.expand(
      [ "timeline", scheduledTick, spec.definition.getMatchingClass(), spec.definition.method],
      this.eventMemory(), true) as AnyEvent[];

    delete event.relativeTime; // relative time is used and discarded

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
      let tick = timeline["" + last] as SpecMap<AnyEvent>;
      if (tick !== undefined) {
        for (const category in tick) {
          const classSpec: ClassSpec<AnyEvent> = tick[category];
          for (const methodName in classSpec) {
            const tasks: AnyEvent[] = classSpec[methodName];
            for (let i = 0; i < tasks.length; i++) {
              const commands = botMemory() as Commands;
              if (commands.debugScheduled) {
                debugger; // Commands.debugEvents
              }
              const task = EventSpec.hydrate(tasks[i]);
              const jp = task.definition.clone();
              jp.resolve();
              // EventSpec invoke is immediate execution
              // ScheduleSpec invoke will re-schedule when invoked
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

  protected beforeCall(jp: Joinpoint<any, any>): Function {
    if (!jp.isCaptured()) {
      debugger; // jp not captured before call
    }
    // : BeforeCallback<any> = (className, objectId, func, result, args) => {
    const interceptors = this.getInterceptors(jp, EventSpec.BEFORE_CALL);
    if (interceptors === undefined || interceptors.length === 0) {
      return jp.proceed();
    }

    const unwrapped = Object.create(jp);
    unwrapped.resolve();
    for (let i = 0; i < interceptors.length; i++) {
      const interceptor = interceptors[i];
      // interceptor has full control over jp invocations
      if (interceptor.test(unwrapped) && interceptor.invoke(unwrapped, this)) {
        return unwrapped.returnValue;
      }
    }

    return jp.proceed();
  }

  protected afterFail(jp: Joinpoint<any, any>): any {
    if (!jp.isFailed()) {
      debugger; // jp not captured before call
    }
    jp.unresolve(); // TODO remove, should be safe with Object.create in stack
    const interceptors = this.getInterceptors(jp, EventSpec.AFTER_FAIL);
    if (interceptors === undefined || interceptors.length === 0) {
      throw jp.thrownException;
    }

    const unwrapped = Object.create(jp);
    unwrapped.resolve();
    for (let i = 0; i < interceptors.length; i++) {
      const interceptor = interceptors[i];
      // TODO how to handle interceptor invoke decisions (preventdefault etc)
      if (interceptor.test(unwrapped) && interceptor.invoke(unwrapped, this)) {
        return unwrapped.returnValue;
      }
    }

    throw unwrapped.thrownException;
  }

  protected getInterceptors(jp: Joinpoint<any, any>, callState: number): EventSpec<any, any>[] {
    return F.expand([ callState, jp.getMatchingClass(), jp.method ], this._interceptors, true) as AnyEvent[];
  }

  protected eventMemory(): EventMemory {
    const mem = F.expand(["events"], botMemory()) as EventMemory;
    return mem;
  }
}
