import Named from "../named";

export interface SchedulableRegistry extends CallbackRegistry {
  /**
   * creep to be spawned
   */
  onSpawn (callback: Function, ...args: any[]): SchedulableRegistry;
  /**
   * creep will die
   */
  onDeath (callback: Function, ...args: any[]): SchedulableRegistry;
  /**
   * energy will be full
   */
  onFull  (callback: Function, ...args: any[]): SchedulableRegistry;
  /**
   * energy will be empty
   */
  onEmpty (callback: Function, ...args: any[]): SchedulableRegistry;
  /**
   * creep moved in last tick
   */
  onMove  (callback: Function, ...args: any[]): SchedulableRegistry;
  /**
   * fatigue was high but is now zero
   */
  onRested(callback: Function, ...args: any[]): SchedulableRegistry;
  /**
   * structure will decay
   */
  onDecay (callback: Function, ...args: any[]): SchedulableRegistry;
}

export interface FailureEvents extends Registry {
  createCreep(failureCode: number, body: string[], name?: string, mem?: any): void;
  move(failureCode: number, direction: number): void;
  moveTo(failureCode: number, direction: number): void; // route planning failure?
}

export interface TriggeredEvents extends Registry {
  preMove(pos: RoomPosition): TriggeredEvents;
  onMove(): TriggeredEvents; // dispatches
  onDone(site: ConstructionSite): TriggeredEvents; // TODO build -> done -> built
}

export interface CallbackRegistry {
  on(event: string, callback: Function, ...args: any[]): CallbackRegistry;
}

export interface Registry {
  on(event: string, ...args: any[]): Registry;
}

export interface EventRegistry {
  schedule(relativeTime: number, instance: Named): SchedulableRegistry;
  failure(instance: Named): FailureEvents;
  dispatch(instance: Named): TriggeredEvents;
}
export default EventRegistry;
