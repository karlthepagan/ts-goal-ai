export interface Score {
  setScore(name: string, value: number): void;
  copyScore(dstMetric: string, srcMetric: string): boolean;
  timeout(name: string): void;

  // TODO proxy ideas!
  // set(value: number): T;
  // copyTo(func: (i: T) => number): T;
}
