import Goal from "./goal";
import * as Low from "./low";
import Plan from "./plan";
import SourceState from "../state/sourceState";
import log from "../log";

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

  /**
   * elect a winning plan
   *
   * enumerate all source work locations,
   */
  public elect(state: SourceState, plan: Plan<Creep>[]): Plan<Creep>[] {

    const workPositions = state.locations();

    log(this, "electing from work locations", ...workPositions);

    const commit: Plan<Creep>[] = [];
    const positions: RoomPosition[] = [];

    let closest = -1;
    let dist = 10000;
    for (const pos of workPositions) {
      for (let i = plan.length - 1; i >= 0; i--) {
        const p = plan[i];
        const creep = p.resource();
        // TODO better scoring for near capacity
        if (creep.carry.energy + creep.carry.power > creep.carryCapacity * 0.9) {
          creep.say("full");
          continue;
        }

        if (commit.lastIndexOf(p) >= 0) {
          continue;
        }

        const range = plan[i].resource().pos.getRangeTo(pos);
        console.log(range);
        if (range < dist) {
          dist = range;
          closest = i;
        }
      }

      if (closest >= 0) {
        commit.push(plan[closest]);
        positions.push(pos);
      }
    }

    if (commit.length > 0) {
      console.log("creeps", ...commit);
      console.log("positions", ...positions);
    }

    // TODO transform plans into move plans

    return commit;
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
