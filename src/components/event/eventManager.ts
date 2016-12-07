import {log} from "../support/log";
import * as F from "../functions";
import Named from "../named";
import {botMemory} from "../../config/config";
import {EventRegistry, When, ApiCalls, Action} from "./index";
import State from "../state/abstractState";
import ProxyChainBuilder from "../behavior/proxyChainBuilder";
import {registerBehavior} from "../behavior/behaviorContext";
import EventSpecBuilders from "./eventSpecBuilder";
import InterceptorSpecBuilders from "./interceptorSpecBuilders";
import {newIS} from "./interceptorSpec";
import * as Builders from "./builders";

type Event = {name: string, id: string, method: string, args: any[]};

interface Tick {
  [eventName: string]: Event[];
}

interface EventMemory {
  /**
   * last dispatched event tick
   */
  lastTick: number;

  /**
   * Map of time indexes to lists of callback declarations
   */
  timeline: { [key: string]: Tick };
}

type InstanceTick = {instance: Named, tick: Tick};
type EventHandler<T> = (event: string, ...args: any[]) => T;
type BuilderEventHandler<T> = (...args: any[]) => T;

abstract class EventProxy<T, V> implements ProxyHandler<T> { // as V (extends Registry|CallbackRegistry)
  public get(target: T, eventMethod: string, receiver: V): BuilderEventHandler<V> {
    if (eventMethod === "on") {
      return this.genericHandler(target, receiver) as any; // TODO cleanup?
    }

    return this.handler(eventMethod, target, receiver);
  }

  protected abstract handleEvent(target: T, eventName: string, ...args: any[]): void;

  private genericHandler(target: T, receiver: V): EventHandler<V> {
    return (event, ...args) => {
      const eventName = "on" + capitalize(event);
      this.handleEvent(target, eventName, ...args);
      return receiver;
    };
  }

  private handler(eventName: string, target: T, receiver: V): BuilderEventHandler<V> {
    return (...args) => {
      this.handleEvent(target, eventName, ...args);
      return receiver;
    };
  }
}

class ScheduleManager { // TODO new handler replacing extends EventProxy<InstanceTick, SchedulableRegistry> {
  protected handleEvent(target: InstanceTick, eventName: string, ...args: any[]): void {
    const name = target.instance.className();
    const id = target.instance.getId();

    const f: Function = args[0];
    args = Array.prototype.slice.call(args, 1);
    const method = f === undefined ? "" : f.name;

    const events: Event[] = F.expand([eventName], target.tick, true);
    events.push({name, id, method, args});
  }
}

class DispatchManager extends EventProxy<Named, any> { // TODO new proxy interface for dispatch
  protected handleEvent(target: Named, eventName: string, ...args: any[]): void {
    target = target;
    args = args;
    debugger; // register interrupt
    log.debug("interrupt: ", eventName);
  }
}

class FailureManager extends EventProxy<Named, any> { // TODO new proxy interface for failure (probably just intercepts)
  protected handleEvent(target: Named, eventName: string, ...args: any[]): void {
    target = target;
    eventName = eventName;
    args = args;
  }
}

export default class EventManager implements EventRegistry {
  private _events: ProxyChainBuilder = new ProxyChainBuilder(
    EventSpecBuilders.handler,
    (spec) => {
      // cleanup, erase constructor info
      const is = newIS(spec);
      delete is.targetConstructor;
      registerBehavior("event", is);
    }
  );

  private _intercepts: ProxyChainBuilder = new ProxyChainBuilder(
    InterceptorSpecBuilders.handler,
    (spec) => {
      // cleanup, erase constructor info
      const is = newIS(spec);
      delete is.targetConstructor;
      registerBehavior("intercept", is);
    }
  );

  private _scheduler: ProxyChainBuilder = new ProxyChainBuilder(
    Builders.scheduleHandler,
    (spec) => {
      const is = newIS(spec);
      delete is.targetConstructor;
      const relativeTime = is.parameter;

      log.debug("TODO schedule event for ", relativeTime);
      // const tick = F.expand([ "timeline", "" + relativeTime ], this.memory()) as SpecMap;
    }
  );

  private _dispatchTime: number|undefined;

  public dispatchTime(): number|undefined {
    return this._dispatchTime;
  }

  public dispatchTick(time: number) {
    this._dispatchTime = time;
    let last = F.elvis(this.memory().lastTick, time - 1);
    const timeline = F.expand([ "timeline" ], this.memory());

    while (last++ < time) {
      let tick = timeline["" + last];
      if (tick !== undefined) {
        for (const eventName in tick) {
          for (const event of tick[eventName]) {
            const instance = State.vright(event.name, event.id) as any;
            const f = instance[event.method] as Function;
            f.call(instance, ...event.args);
          }
        }
      }

      this.memory().lastTick = last;
      delete timeline["" + last];
    }
    this._dispatchTime = undefined;
  }

  public when() {
    return this._events.newProxyChain() as any;
  }

  // intercept       <API, INST extends State<API>>(implType: (...args: any[]) => State<API>): WhenClosure<INST, API>;
  // intercept       <API>(implType: Constructor<State<API>>): WhenClosure<State<API>, API>;
  public intercept(implType: any) {
    return this._intercepts.newProxyChain(implType) as any;
  }

  public schedule<T extends Named>(relativeTime: number, instance: T) { // : Action<OnScheduled, INST, void> {
    if (isNaN(relativeTime)) {
      debugger; // illegal relativeTime
      throw new Error("illegal relativeTime");
    }
    if (relativeTime < 1) {
      // TODO assertions?
      // tick = { toString: () => "NO TICK" } as Tick;
      // TODO NOOP proxy
      throw new Error("illegal relativeTime=" + relativeTime);
    } else {
      relativeTime += F.elvis(this.dispatchTime(), Game.time); // TODO should we fastforward ever?
      // tick = F.expand([ "timeline", "" + relativeTime ], this.memory()) as Tick;
    }
    return this._scheduler.newProxyChain(relativeTime, instance) as any;
    // old -- new Proxy({instance, tick}, this._scheduler)
  }

  protected memory(): EventMemory {
    const mem = F.expand(["events"], botMemory()) as EventMemory;
    return mem;
  }
}

export class EventManager2 { // implements EventRegistry {
  private _scheduler: ScheduleManager = new ScheduleManager();
  private _dispatcher: DispatchManager = new DispatchManager();
  private _failures: FailureManager = new FailureManager();
  private _dispatchTime: number|undefined;

  public dispatchTime(): number|undefined {
    return this._dispatchTime;
  }

  /**
   * ticks may be delayed to allow for CPU conservation
   */
  public dispatchTick(time: number) {
    this._dispatchTime = time;
    let last = F.elvis(this.memory().lastTick, time - 1);
    const timeline = F.expand([ "timeline" ], this.memory());

    while (last++ < time) {
      let tick = timeline["" + last];
      if (tick !== undefined) {
        for (const eventName in tick) {
          for (const event of tick[eventName]) {
            const instance = State.vright(event.name, event.id) as any;
            const f = instance[event.method] as Function;
            f.call(instance, ...event.args);
          }
        }
      }

      this.memory().lastTick = last;
      delete timeline["" + last];
    }
    this._dispatchTime = undefined;
  }

  // TODO method to look for the ticks remaining to and subject of a pending event

  public schedule(relativeTime: number, instance: Named) { // TODO new handler
    if (isNaN(relativeTime)) {
      debugger; // illegal relativeTime
      throw new Error("illegal relativeTime");
    }
    let tick: Tick;
    if (relativeTime < 1) {
      // TODO assertions?
      tick = { toString: () => "NO TICK" } as Tick;
    } else {
      relativeTime += F.elvis(this.dispatchTime(), Game.time); // TODO should we fastforward ever?
      tick = F.expand([ "timeline", "" + relativeTime ], this.memory()) as Tick;
    }
    return new Proxy({instance, tick}, this._scheduler) as any;
  }

  public failure(instance: Named) { // TODO handler
    return new Proxy(instance, this._failures) as any;
  }

  public dispatch(instance: Named) { // TODO handler
    return new Proxy(instance, this._dispatcher) as any;
  }

  public intercept<INST extends State<any>>(instance: INST): When<ApiCalls<INST>> {
    return new Proxy(instance, this._dispatcher) as any; // TODO implement
  }

  public next<INST extends State<any>>(instance: INST): When<ApiCalls<INST>> {
    return new Proxy(instance, this._dispatcher) as any; // TODO implement
  }

  public run<INST extends Named>(instance: INST): Action<Function, void, void> {
    return new Proxy(instance, this._dispatcher) as any; // TODO implement
  }

  protected memory(): EventMemory {
    const mem = F.expand(["events"], botMemory()) as EventMemory;
    return mem;
  }
}

function capitalize(n: string) {
  return n.charAt(0).toUpperCase() + n.substring(1);
}
