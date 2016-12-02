import {log} from "../support/log";
import * as F from "../functions";
import {SchedulableRegistry, EventRegistry, Registry} from "./index";
import Named from "../named";

interface Tick {
  spawn: {name: string, id: string, args: any[]}[];
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

class ScheduleManager implements ProxyHandler<Tick> {
  public get(target: Tick, eventMethod: string, receiver: SchedulableRegistry
          ): (instance: Named, args: any[]) => SchedulableRegistry {

    log.debug("schedules register", eventMethod);
    if (eventMethod === "on") {
      return this.genericRegisterHandler(target, receiver) as any; // TODO cleanup?
    }

    return (instance, args) => {
      const name = instance.className();
      const id = instance.getId();
      F.expand([eventMethod], target, true).push({name, id, args});
      return receiver;
    };
  }

  public genericRegisterHandler(target: Tick, receiver: SchedulableRegistry
          ): (event: string, instance: Named, args: any[]) => Registry<Named> {
    return (instance, args) => {
      return receiver;
    };
  }
}

export default class EventManager implements EventRegistry {
  private _memory: EventMemory;
  private _schedule: ScheduleManager;

  constructor(mem: any) {
    this._schedule = new ScheduleManager();
    this._memory = mem = mem.events = {} as EventMemory;
    mem.timeline = {};
  }

  /**
   * ticks may be delayed to allow for CPU conservation
   */
  public dispatchTick(time: number) {
    let last = this._memory.lastTick;

    while (last < time) {
      let events = this._memory.timeline[last + 1];
      events = events;
      // TODO callbacks

      this._memory.lastTick = ++last;
    }
  }

  public schedule(relativeTime: number) {
    log.debug("scheduling for", relativeTime);
    return new Proxy(F.expand([relativeTime], this._memory.timeline), this._schedule) as SchedulableRegistry;
    // new ScheduleManager(F.expand([relativeTime + ""], this._memory.timeline));
  }
}
