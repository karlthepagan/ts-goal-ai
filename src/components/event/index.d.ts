interface SchedulableRegistry {
  onSpawn<T>(instanceId: string, callback?: (i: T, args: any[]) => void, ...args: any[]): SchedulableRegistry;
}

interface EventRegistry {
  schedule(relativeTime: number): SchedulableRegistry;
}
export default EventRegistry;
