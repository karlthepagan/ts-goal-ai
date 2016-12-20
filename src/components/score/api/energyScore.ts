import {Score} from "./score";

export interface EnergyScore extends Score {
  energyDelta(): number;
  energy(): number;
  energyNorm(): number;
  energyVelNorm(): number;
  energyVel(): number;
  energyTime(): number;
}
