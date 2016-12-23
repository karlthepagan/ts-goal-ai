export type ScoreFunc<T> = (value: T) => Scored<T>;
export type Scored<T> = { value: T, score: number };

export interface Score {
  setScore(name: string, value: number): void;
  getScore(name: string): number;
  copyScore(dstMetric: string, srcMetric: string): boolean;
  clearScore(name: string): void;
  timeoutScore(name: string): void;

  /**
   * default summary of value in game
   */
  score(): number;
  /**
   * current change in energy contributed by this entity (construction spend, source extraction)
   */
  energyVel(): number;

  // TODO proxy ideas!
  // set(value: number): T;
  // copyTo(func: (i: T) => number): T;
}
