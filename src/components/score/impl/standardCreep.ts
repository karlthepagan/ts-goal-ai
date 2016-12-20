import ScoreMixin from "../scoreMixin";
import CreepState from "../../state/creepState";
import * as F from "../../functions";
import {CreepScore} from "../api/creepScore";
import {TERRAIN_PLAIN} from "../../constants";
import {globalLifecycle} from "../../event/behaviorContext";

export const DISTANCE_WEIGHT = 9;
export const FATIGUE_WEIGHT = 4;
export const ENERGY_WORK_WEIGHT = 2; // harvest 2 units per tick
export const BUILD_WORK_WEIGHT = 5; // add 5 progress per tick
export const ROAD_WEIGHT = 3; // cost to maintain roads
export const SWAMP_WEIGHT = 1; // cost to route around swamps
export const COMBAT_DANGER = 10; // TODO implement risk

abstract class StandardCreep extends ScoreMixin<CreepState> implements CreepScore {
  public energyVel() {
    // TODO is our source non-empty?
    return this._state.getSourceMined() ? this.energyVelNorm() : 0;
  }

  public score() {
    return this.energyVelNorm() + this.transportVel();
  }

  // public road() {
  //   if (this._state.isCarrying()) {
  //     return (ROAD_WEIGHT * this._state.maxMovePenalty(TERRAIN_PLAIN) - this._state.maxMovePenalty(TERRAIN_ROAD))
  //       / this._state.getWeight();
  //   }
  //   return (ROAD_WEIGHT * this._state.minMoveFatigue(TERRAIN_PLAIN) - this._state.minMoveFatigue(TERRAIN_ROAD))
  //     / this._state.getWeight();
  // }
  //
  // public work() {
  //   return this._state.subject().getActiveBodyparts(WORK);
  // }
  //
  // public ttl() {
  //   return this._state.subject().ticksToLive;
  // }

  public move() {
    return this._state.maxMoveFatigue(TERRAIN_PLAIN);
  }

  public transportVel() {
    return this.energyNorm() / this.move();
  }

  public energy() {
    this._state.resolve(globalLifecycle);
    return F.elvis(this._state.subject().carry.energy, 0);
  }

  public energyNorm() {
    this._state.resolve(globalLifecycle);
    return this._state.subject().carryCapacity;
  }

  public energyVelNorm() {
    this._state.resolve(globalLifecycle);
    return 2 * this._state.subject().getActiveBodyparts(WORK);
  }

  public energyTime() {
    // energy space remaining / ticks to fill
    return (this.energyNorm() - this.energy()) / this.energyVel(); // TODO cache in memory segment?
  }

  public abstract risk(): number;
}
StandardCreep.prototype.energyVel = ScoreMixin.timed(StandardCreep.prototype, "energyTime", StandardCreep.prototype.energyVel);
export default StandardCreep;
