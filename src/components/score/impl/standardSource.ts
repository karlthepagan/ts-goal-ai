import ScoreMixin from "../scoreMixin";
import SourceState from "../../state/sourceState";
import {SourceScore} from "../api/sourceScore";

export default class StandardSource extends ScoreMixin<SourceState> implements SourceScore {
  public risk: () => number = super.cached(function risk() {
    return undefined;
  });

  public energyDelta: () => number = super.timed("energyTime", function energyDelta() {
    return undefined;
  });

  public energy() {
    return this._state.subject().energy;
  }
// ** xe: it => it.energyCapacity / 300;
// ** ve: it => it.energy / it.ticksToRegeneration;
// ** de: it => undefined

  public energyNorm() { // TODO cache if non-zero risk
    return this._state.subject().energyCapacity;
  }

  public energyVelNorm() {
    return this._state.subject().energyCapacity / 300;
  }

  public energyVel() {
    return this._state.subject().energy / this._state.subject().ticksToRegeneration;
  }

  public energyTime() {
    // remaining ticks until reset
    return this._state.subject().ticksToRegeneration;
  }
}
