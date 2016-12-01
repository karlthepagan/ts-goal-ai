import Named from "../named";

export interface SchedulableRegistry {
  onSpawn<T extends Named>(instance: T, ...args: any[]): SchedulableRegistry;
}

export interface EventRegistry {
  schedule(relativeTime: number): SchedulableRegistry;
}
export default EventRegistry;
