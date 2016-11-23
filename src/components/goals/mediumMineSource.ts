import Goal from "./goal";
import * as Low from "./low";
import Plan from "./plan";
import SourceState from "../state/sourceState";

/**
 * exhaust all
 */
export default class MineSource extends Goal<Source, Creep, SourceState> {
  private _id: string;

  constructor(plan: Plan<Source>) {
    super(plan);

    this._id = plan.resource().id;
  }

  public state(actor: Source): SourceState {
    return SourceState.right(actor);
  }

  public getGoalKey(): string {
    return Low.GOAL_MINE_SOURCE;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  protected _identifyResources(state: SourceState): Creep[] {
    return state.parent().creeps(); // TODO find nearby creeps, not just room creeps
  }

  protected _goalPriority(): string[] {
    // TODO genome
    return [
      Low.GOAL_GET_ENERGY, // creep
      // Low.GOAL_STORE_ENERGY, // creep
    ];
  }
}
