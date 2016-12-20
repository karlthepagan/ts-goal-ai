import ScoreMixin from "../scoreMixin";
import SourceState from "../../state/sourceState";
import {SourceScore} from "../api/sourceScore";
import * as F from "../../functions";
import {globalLifecycle} from "../../event/behaviorContext";

abstract class StandardSource extends ScoreMixin<SourceState> implements SourceScore {
  public risk = super.memoized(function risk() {
    const pos = this._state.pos();

    // TODO later optimize
    return F.elvis(_.chain(pos.lookFor(LOOK_FLAGS))
      .sum((f: Flag) => f.color === COLOR_RED ? -1000 : 0).value(), 0);
  });

  public score() {
    return this.risk() + this.energyVelNorm();
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
export default StandardSource;
