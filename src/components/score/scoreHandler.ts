import ScoreManager from "./scoreManager";

type ScoreHandler<S, T> = (state: S, score?: ScoreManager<T>, time?: number|undefined) => number|undefined;
export default ScoreHandler;

// TODO score hander's do not support arbitrary memory for State objects
