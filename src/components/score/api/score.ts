export interface Score {
  setScore(name: string, value: number): void;
  copyScore(dstMetric: string, srcMetric: string): boolean;
}
