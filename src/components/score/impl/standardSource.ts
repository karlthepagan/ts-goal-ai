import ScoreMixin from "../scoreMixin";
import SourceState from "../../state/sourceState";
import {SourceScore} from "../api/sourceScore";
import * as F from "../../functions";
import {globalLifecycle} from "../../event/behaviorContext";
import RoomState from "../../state/roomState";

const DISTANCE_WEIGHT = 90;

abstract class StandardSource extends ScoreMixin<SourceState> implements SourceScore {
  public transportVel(): number { // memoized
    const pos = this._state.pos();
    const ownRoom = RoomState.vleft(pos.roomName);

    let distanceScore = Infinity;

    // tenergy - distance to an energy transport building
    // TODO 1 - score distance to adjacent rooms (& store paths)
    // TODO 2 - score distance on paths & from exits to all storage in that room

    // 3 - score distance to closest energy user in same room
    if (ownRoom.resolve(globalLifecycle)) {
      const realRoom = ownRoom.subject();

      const roomSiteScore = _(
        realRoom.find(FIND_CONSTRUCTION_SITES, {filter: F.wantsEnergy}))
        .concat(
          realRoom.find(FIND_MY_STRUCTURES, {filter: F.wantsEnergy}))
        .sortBy(F.byRangeTo(pos))
        .map(F.byRangeScore(pos))
        .first();

      distanceScore = Math.min(distanceScore, roomSiteScore);
      return DISTANCE_WEIGHT / distanceScore; // TODO distance weight  });
    } else {
      return undefined as any; // wrapped with memoized
    }
  }

  public risk() { // memoized
    return _.chain(this._state.pos().lookFor(LOOK_FLAGS))
      .sum((f: Flag) => f.color === COLOR_RED ? -1000 : 0).value();
  }

  public score() {
    return this.risk() + this.energyVelNorm() + this.transportVel();
  }

  public energy() {
    this._state.resolve(globalLifecycle);
    return this._state.subject().energy;
  }

  public energyNorm() { // TODO cache if non-zero risk
    this._state.resolve(globalLifecycle);
    return this._state.subject().energyCapacity;
  }

  public energyVelNorm() {
    this._state.resolve(globalLifecycle);
    return this._state.subject().energyCapacity / 300;
  }

  public energyVel() {
    this._state.resolve(globalLifecycle);
    return this._state.subject().energy / this._state.subject().ticksToRegeneration;
  }

  public energyTime() {
    // remaining ticks until reset
    this._state.resolve(globalLifecycle);
    return this._state.subject().ticksToRegeneration;
  }

  // TODO later transportVel
}
StandardSource.prototype.risk = ScoreMixin.memoized(StandardSource.prototype.risk);
StandardSource.prototype.transportVel = ScoreMixin.memoized(StandardSource.prototype.transportVel);
export default StandardSource;
