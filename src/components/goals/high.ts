import Goal from "./goal";
import State from "../state/abstractState";
import Expand from "./highExpand";
import RoomControlLevel from "./highRcl";
import ScoutRoom from "./highScoutRoom";
export const GOAL_MASTER = "think";
export const GOAL_RCL = "rcl";
export const GOAL_EXPAND = "expand";
export const GOAL_SCOUT = "scout";

type GoalLambda = (actor: any) => Goal<any, any, State<any>>;

// goal constructors
export const goals: { [key: string]: GoalLambda } = {};

goals[GOAL_EXPAND] = Expand.constructor as GoalLambda;
goals[GOAL_RCL] = RoomControlLevel.constructor as GoalLambda;
goals[GOAL_SCOUT] = ScoutRoom.constructor as GoalLambda;
/*

 game domain goals

 expand should consume AI priority until it is adventageous to expand

 */
