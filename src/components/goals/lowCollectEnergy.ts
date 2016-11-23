import RoomState from "../state/roomState";
import Goal from "./goal";
import CreepState from "../state/creepState";
import * as Low from "./low";
import Plan from "./plan";

export default class CollectEnergy extends Goal<Creep, RoomPosition, CreepState> {
  public static fromRoomState(state: RoomState): Creep[] {
    // all creeps are collect energy candidates
    return state.parent().creeps();
  }

  private _id: string;

  constructor(plan: Plan<Creep>) {
    super(plan);

    this._id = plan.resource().id;
  }

  public getGoalKey(): string {
    return Low.GOAL_GET_ENERGY;
  }

  public state(actor: Creep): CreepState {
    return CreepState.right(actor);
  }

  public toString(): string {
    return this.getGoalKey() + "[creep " + this._id + "]";
  }

  /**
   * given the incoming state
   */
  protected _identifyResources(state: CreepState): RoomPosition[] {
    state = state;

    // TODO find closest energy mining locations

    return [];
  }
}
