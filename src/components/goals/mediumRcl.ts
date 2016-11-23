import Goal from "./goal";
import * as Medium from "./medium";
import * as Low from "./low";
import RoomState from "../state/roomState";
import GoalState from "../state/goalState";
import Plan from "./plan";

/**
 * expand territory and max out each controlled territory
 */
export default class RoomControlLevel extends Goal<Room, Room, RoomState> {
  public static fromGoalState(state: GoalState): Room[] {
    return _.values(state.subject().rooms) as Room[];
  }

  private _address: string;

  constructor(plan: Plan<Room>) {
    super(plan);

    this._address = plan.resource().name;
  }

  public state(actor: Room): RoomState {
    return RoomState.right(actor);
  }

  public getGoalKey(): string {
    return Medium.GOAL_RCL;
  }

  public toString(): string {
    return this.getGoalKey();
  }

  protected _identifyResources(state: RoomState): Room[] {
    return [ state.subject() ];
  }

  protected _goalPriority(): string[] {
    // TODO genome
    return [
      Medium.GOAL_ENERGY_VELOCITY, // room -> source -> creep
      Low.GOAL_UPGRADE_CONTROLLER, // room -> creep
      Low.GOAL_CREATE_CREEP, // room -> spawn
    ];
  }
}
