import Goal from "./goal";
import State from "../state/abstractState";
import Expand from "./highExpand";
import RoomControlLevel from "./highRcl";
import ScoutRoom from "./highScoutRoom";
import GoalState from "../state/goalState";
export const GOAL_MASTER = "think";
export const GOAL_RCL = "rcl";
export const GOAL_EXPAND = "expand";
export const GOAL_SCOUT = "scout";

type GoalLambda = (actor: any) => Goal<any, any, State<any>>;
type CandidateLambda = (state: GoalState) => any[];

export const goalStateActors: { [key: string]: CandidateLambda } = {};

goalStateActors[GOAL_EXPAND] = Expand.fromGoalState;
goalStateActors[GOAL_RCL] = RoomControlLevel.fromGoalState;
goalStateActors[GOAL_SCOUT] = ScoutRoom.fromGoalState;

// goal constructors
export const goals: { [key: string]: GoalLambda } = {};

goals[GOAL_EXPAND] = () => new Expand();
goals[GOAL_RCL] = (a) => new RoomControlLevel(a);
goals[GOAL_SCOUT] = (a) => new ScoutRoom(a);
/*

 game domain goals

 expand should consume AI priority until it is adventageous to expand

 */
