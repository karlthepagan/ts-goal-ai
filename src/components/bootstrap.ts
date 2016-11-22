import {goalStateActors, goals, roomStateActors} from "./goals/goals";
import * as High from "./goals/high";
import * as Medium from "./goals/medium";
import * as Low from "./goals/low";
import Expand from "./goals/highExpand";
import RoomControlLevel from "./goals/mediumRcl";
import ScoutRoom from "./goals/highScoutRoom";
import CollectEnergy from "./goals/lowCollectEnergy";
import Sticky from "./goals/highSticky";
import GlobalControlIncrease from "./goals/highGcl";

export const bootstrap: (() => void)[] = [];

// goals.ts
bootstrap.push(() => {
  goalStateActors[High.GOAL_STICKY] = Sticky.fromGoalState;
  goals[High.GOAL_STICKY] = () => new Sticky();
  goalStateActors[High.GOAL_EXPAND] = Expand.fromGoalState;
  goals[High.GOAL_EXPAND] = () => new Expand();
  goalStateActors[High.GOAL_GCL] = GlobalControlIncrease.fromGoalState;
  goals[High.GOAL_GCL] = () => new GlobalControlIncrease();
  goalStateActors[Medium.GOAL_RCL] = RoomControlLevel.fromGoalState;
  goals[Medium.GOAL_RCL] = (a: Room) => new RoomControlLevel(a);
  goalStateActors[Medium.GOAL_SCOUT] = ScoutRoom.fromGoalState;
  goals[Medium.GOAL_SCOUT] = (a: Creep) => new ScoutRoom(a);
  // TODO goals[] = CollectEnergy
  roomStateActors[Low.GOAL_GET_ENERGY] = CollectEnergy.fromRoomState;
});
