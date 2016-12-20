import ScoreMixin from "../scoreMixin";
import CreepState from "../../state/creepState";
import * as F from "../../functions";
import {CreepScore} from "../api/creepScore";
import {TERRAIN_PLAIN} from "../../constants";

abstract class StandardCreep extends ScoreMixin<CreepState> implements CreepScore {
  public energyVel = super.timed("energyTime", function energyVel() {
    // TODO is our source non-empty?
    return this._state.getSourceMined() ? this.energyVelNorm() : 0;
  });

  public transportVel(): number {
    return this.energyNorm() / this._state.maxMoveFatigue(TERRAIN_PLAIN);
  }

  public energy() {
    return F.elvis(this._state.subject().carry.energy, 0);
  }

  public energyNorm() {
    return this._state.subject().carryCapacity;
  }

  public energyVelNorm() {
    return 2 * this._state.subject().getActiveBodyparts(WORK);
  }

  public energyTime() {
    // energy space remaining / ticks to fill
    return (this.energyNorm() - this.energy()) / this.energyVel(); // TODO cache in memory segment?
  }

  public abstract risk(): number;
}
export default StandardCreep;
