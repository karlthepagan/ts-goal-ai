import ScoreMixin from "../scoreMixin";
import CreepState from "../../state/creepState";
import * as F from "../../functions";
import {CreepScore} from "../api/creepScore";

export default class StandardCreep extends ScoreMixin<CreepState> implements CreepScore {
  public energyDelta: () => number = super.timed("energyTime", function energyDelta() {
    return undefined;
  });

  public energy() {
    return F.elvis(this._state.subject().carry.energy, 0);
  }

  public energyNorm() {
    return this._state.subject().carryCapacity;
  }

  public energyVelNorm() {
    return 2 * this._state.subject().getActiveBodyparts(WORK);
  }

  public energyVel() {
    // TODO is our source non-empty?
    return this._state.getSourceMined() ? this.energyVelNorm() : 0;
  }

  public energyTime() {
    // energy space remaining / ticks to fill
    return (this.energyNorm() - this.energy()) / this.energyVel(); // TODO cache in memory segment?
  }
}
