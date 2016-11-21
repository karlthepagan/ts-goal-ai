export const GOAL_MASTER = "think";
export const GOAL_RCL = "rcl";
export const GOAL_EXPAND = "expand";
export const GOAL_SCOUT = "scout";

// TODO externalize MasterGoal priorities
export const priority: string[] = [
  GOAL_EXPAND,
  GOAL_RCL,
  GOAL_SCOUT,
];
/*

 game domain goals

 expand should consume AI priority until it is adventageous to expand

 */
