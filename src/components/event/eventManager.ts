import {log} from "../support/log";
import * as F from "../functions";
import {SchedulableRegistry, EventRegistry} from "./index";
import Named from "../named";

const ON_SPAWN = "spawn";

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
  timeline: { [key: string]: Tick };
}

class ScheduleManager implements SchedulableRegistry {
  private _tick: Tick;

  constructor(tick: Tick) {
    this._tick = tick;
  }

  public onSpawn<T extends Named>(instance: T, ...args: any[]) {
    const name = instance.className();
    const id = instance.getId();
    F.expand([ON_SPAWN], this._tick, true).push({name, id, args});
    return this;
  }
}

export default class EventManager implements EventRegistry {
  private _memory: EventMemory;

  constructor(mem: any) {
    this._memory = mem = mem.events = {} as EventMemory;
    mem.timeline = {};
  }

  /**
   * ticks may be delayed to allow for CPU conservation
   */
  public dispatchTick(time: number) {
    let last = this._memory.lastTick;

    while (last < time) {
      let events = this._memory.timeline[last + 1 + ""];
      events = events;
      // TODO callbacks

      this._memory.lastTick = ++last;
    }
  }

  public schedule(relativeTime: number) {
    log.debug("scheduling for", relativeTime);
    return new ScheduleManager(F.expand([relativeTime + ""], this._memory.timeline));
  }
}
