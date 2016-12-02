import {log} from "../support/log";
import * as F from "../functions";
import {SchedulableRegistry, EventRegistry, FailureEvents, TriggeredEvents} from "./index";
import Named from "../named";

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
  timeline: { [key: number]: Tick };
}

type InstanceTick = {instance: Named, tick: Tick};
type EventHandler<T> = (event: string, args: any[]) => T;
type BuilderEventHandler<T> = (args: any[]) => T;

abstract class EventProxy<T, V> implements ProxyHandler<T> { // as V (extends Registry|CallbackRegistry)
  public get(target: T, eventMethod: string, receiver: V): BuilderEventHandler<V> {
    if (eventMethod === "on") {
      return this.genericHandler(target, receiver) as any; // TODO cleanup?
    }

    return this.handler(eventMethod, target, receiver);
  }

  protected abstract handleEvent(target: T, eventName: string, args: any[]): void;

  private genericHandler(target: T, receiver: V): EventHandler<V> {
    return (event, args) => {
      const eventName = "on" + capitalize(event);
      this.handleEvent(target, eventName, args);
      return receiver;
    };
  }

  private handler(eventName: string, target: T, receiver: V): BuilderEventHandler<V> {
    return (args) => {
      this.handleEvent(target, eventName, args);
      return receiver;
    };
  }
}

class ScheduleManager extends EventProxy<InstanceTick, SchedulableRegistry> {
  protected handleEvent(target: InstanceTick, eventName: string, args: any[]): void {
    const name = target.instance.className();
    const id = target.instance.getId();

    const f: Function = args[0];
    args = args.slice(1);
    const method = f.name;

    F.expand([eventName], target.tick, true).push({name, id, method, args});
  }
}

class DispatchManager extends EventProxy<Named, TriggeredEvents> {
  protected handleEvent(target: Named, eventName: string, args: any[]): void {
    target = target;
    args = args;
    log.debug("interrupt: ", eventName);
  }
}

class FailureManager extends EventProxy<Named, FailureEvents> {
  protected handleEvent(target: Named, eventName: string, args: any[]): void {
    target = target;
    args = args;
    log.debug("failure: ", eventName);
  }
}

export default class EventManager implements EventRegistry {
  private _memory: EventMemory;
  private _scheduler: ScheduleManager = new ScheduleManager();
  private _dispatcher: DispatchManager = new DispatchManager();
  private _failures: FailureManager = new FailureManager();
  private _classes: { [name: string]: (id: string) => Named } = {};

  constructor(mem: any) {
    this._memory = mem = mem.events = {} as EventMemory;
    mem.timeline = {};
  }

  public registerNamedClass(example: Named, constructor: (id: string) => Named) {
    this._classes[example.className()] = constructor;
  }

  /**
   * ticks may be delayed to allow for CPU conservation
   */
  public dispatchTick(time: number) {
    let last = this._memory.lastTick;

    while (last < time) {
      let tick = this._memory.timeline[last + 1];

      if (tick !== undefined) {
        for (const eventName in tick) {
          for (const event of tick[eventName]) {
            const instance = this._classes[event.name](event.id) as any;
            const f = instance[event.method] as Function;
            f.call(instance, event.args);
          }
        }
      }

      this._memory.lastTick = ++last;
    }
  }

  // TODO method to look for the ticks remaining to and subject of a pending event

  public schedule(relativeTime: number, instance: Named) {
    const tick = F.expand([relativeTime], this._memory.timeline) as Tick;
    return new Proxy({instance, tick}, this._scheduler) as any;
  }

  public failure(instance: Named) {
    return new Proxy(instance, this._failures) as any;
  }

  public dispatch(instance: Named) {
    return new Proxy(instance, this._dispatcher) as any;
  }
}

function capitalize(n: string) {
  return n.charAt(0).toUpperCase() + n.substring(1);
}
