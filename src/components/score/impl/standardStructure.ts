import ScoreMixin from "../scoreMixin";
import {EnergyScore} from "../api/energyScore";
import StructureState from "../../state/structureState";
import * as F from "../../functions";

abstract class StandardStructure extends ScoreMixin<StructureState<any>> implements EnergyScore {
  public energy(): number {
    const c: Container = this._state.subject() as any;
    const store: StoreDefinition = c.store;
    return store ? F.elvis(store.energy, 0) : 0;
  }

  public energyNorm(): number {
    const c: Container = this._state.subject() as any;
    return F.elvis(c.storeCapacity, 0);
  }

  public abstract energyVelNorm(): number;
  public abstract energyTime(): number;
  public abstract score(): number;
  public abstract energyVel(): number;
}
export default StandardStructure;
