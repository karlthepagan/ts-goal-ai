export const GOAL_DESIGN_CREEP = "design";
export const GOAL_INFRASTRUCTURE = "infrastructure";
export const GOAL_DEFENSES = "defenses";
export const GOAL_CLAIM = "claim";

export const priority: string[] = [
  GOAL_DESIGN_CREEP,
  GOAL_INFRASTRUCTURE,
  GOAL_DEFENSES,
  GOAL_CLAIM,
];

/*

 room domain goals

 design creep immediately produces creep specs which this room can produce

 defenses are secondary to infrastructure, work stealing will invert the priority when threats are near

 */
