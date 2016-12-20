export interface Score {
  setScore(name: string, value: number): void;
  getScore(name: string): number;
  copyScore(dstMetric: string, srcMetric: string): boolean;
  timeout(name: string): void;

  /**
   * current change in energy contributed by this entity (construction spend, source extraction)
   */
  energyVel(): number;

  // TODO proxy ideas!
  // set(value: number): T;
  // copyTo(func: (i: T) => number): T;
}
