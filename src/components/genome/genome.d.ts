type FitnessFunction<G, T> = (context: G, state: T) => number[];
interface FitnessHandler<G, T> {
  evaluate(context: G, state: T): number[];
}
