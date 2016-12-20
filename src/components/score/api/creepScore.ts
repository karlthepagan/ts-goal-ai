import {EnergyScore} from "./energyScore";
import {RiskScore} from "./riskScore";

export interface CreepScore extends EnergyScore, RiskScore {
  transportVel(): number; // TODO NOW what does this mean?
  move(): number;
}
