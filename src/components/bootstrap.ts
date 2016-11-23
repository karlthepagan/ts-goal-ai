import {goals} from "./goals/goals";
import * as High from "./goals/high";
import * as Medium from "./goals/medium";
import * as Low from "./goals/low";
import Expand from "./goals/highExpand";
import RoomControlLevel from "./goals/mediumRcl";
import ScoutRoom from "./goals/highScoutRoom";
import CollectEnergy from "./goals/lowCollectEnergy";
import Sticky from "./goals/highSticky";
import GlobalControlIncrease from "./goals/highGcl";
import EnergyVelocity from "./goals/mediumEnergyVelocity";
import MineSource from "./goals/mediumMineSource";
import Design from "./goals/highDesign";

export const bootstrap: (() => void)[] = [];

// goals.ts
bootstrap.push(() => {
  goals[High.GOAL_DESIGN] = (p) => new Design(p);
  goals[High.GOAL_STICKY] = (p) => new Sticky(p);
  goals[High.GOAL_EXPAND] = (p) => new Expand(p);
  goals[High.GOAL_GCL] = (p) => new GlobalControlIncrease(p);

  goals[Medium.GOAL_RCL] = (p) => new RoomControlLevel(p);
  goals[Medium.GOAL_SCOUT] = (p) => new ScoutRoom(p);

  goals[Medium.GOAL_ENERGY_VELOCITY] = (p) => new EnergyVelocity(p);

  goals[Low.GOAL_MINE_SOURCE] = (p) => new MineSource(p);
  goals[Low.GOAL_GET_ENERGY] = (p) => new CollectEnergy(p);
  // goals[Low.GOAL_STORE_ENERGY] = (p) => new StoreEnergy(p);
});
