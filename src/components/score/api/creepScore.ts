import {EnergyScore} from "./energyScore";
import {RiskScore} from "./riskScore";

export interface CreepScore extends EnergyScore, RiskScore {
  energyTransport(): number; // TODO NOW what does this mean?
}
