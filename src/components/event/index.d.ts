import Named from "../named";

export interface SchedulableRegistry extends Registry<Named> {
  onSpawn(instance: Named, ...args: any[]): SchedulableRegistry;
}

export interface Registry<T extends Named> {
  on(event: string, instance: T, ...args: any[]): Registry;
}

export interface EventRegistry {
  schedule(relativeTime: number): SchedulableRegistry;
}
export default EventRegistry;
