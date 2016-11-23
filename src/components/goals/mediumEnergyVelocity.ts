import Goal from "./goal";
import * as Medium from "./medium";
import * as Low from "./low";
import Plan from "./plan";
import RoomState from "../state/roomState";

/**
 * exhaust all
 */
export default class EnergyVelocity extends Goal<Room, Source, RoomState> {
  private _room: string;

  constructor(plan: Plan<Room>) {
    super(plan);

    this._room = plan.resource().name;
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  public getGoalKey(): string {
    return Medium.GOAL_ENERGY_VELOCITY;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  protected _identifyResources(state: RoomState): Source[] {
    return state.sources(); // TODO remote mining
  }

  protected _goalPriority(): string[] {
    // TODO genome
    return [
      Low.GOAL_MINE_SOURCE, // source -> creep
    ];
  }
}
