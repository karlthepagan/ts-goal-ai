import {Score} from "./score";

export interface EnergyScore extends Score {
  /**
   * current primary energy investment (energy carried)
   */
  energy(): number;
  /**
   * maximum primary energy investment (carry capacity)
   */
  energyNorm(): number;
  /**
   * maximum energy change
   */
  energyVelNorm(): number;
  energyTime(): number;
}
