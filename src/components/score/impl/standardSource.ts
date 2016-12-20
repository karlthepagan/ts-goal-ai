import ScoreMixin from "../scoreMixin";
import SourceState from "../../state/sourceState";
import {SourceScore} from "../api/sourceScore";

abstract class StandardSource extends ScoreMixin<SourceState> implements SourceScore {
  public energy() {
    return this._state.subject().energy;
  }

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

  public abstract risk(): number;
}
export default StandardSource;
