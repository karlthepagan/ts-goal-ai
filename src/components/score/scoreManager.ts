import State from "../state/abstractState";
import ScoreMixin from "./scoreMixin";

export default class ScoreManager {
  private _registry: { [stateType: string]: Constructor<ScoreMixin<any>> } = {};

  public registerStrategy<T extends State<any>>(stateType: Constructor<T>, type: any) {
    this._registry[stateType.name] = type;
  }

  public startStrategy<T extends State<any>>(state: T, type: any) { // Constructor<ScoreMixin<T>>) { https://github.com/Microsoft/TypeScript/issues/5843
    if (!type) {
      Object.setPrototypeOf(state.score, ScoreMixin.prototype);
      return;
    }

    const proto = type.prototype; // as ScoreMixin<T>;
    if (proto._timeFunctions) { // TODO SOON - private!
      state.memory = _.defaultsDeep(state.memory, _.cloneDeep({
        score_time: {},
      }));
    }
    Object.setPrototypeOf(state.score, proto);
  }

  public pickStrategy<T extends State<any>>(state: T) {
    this.startStrategy(state, this._registry[state.constructor.name]);
  }
}
