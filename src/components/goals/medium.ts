export const GOAL_DESIGN_CREEP = "design";
export const GOAL_INFRASTRUCTURE = "infrastructure";
export const GOAL_FORTIFY = "fortify";
export const GOAL_RCL = "rcl";
export const GOAL_CLAIM = "claim";
export const GOAL_SCOUT = "scout";
export const GOAL_EVADE = "evade"; // avoid enemies
export const GOAL_ENERGY_VELOCITY = "energyVelocity";

export const priority: string[] = [
  GOAL_DESIGN_CREEP,
  GOAL_ENERGY_VELOCITY,
  GOAL_INFRASTRUCTURE,
  GOAL_FORTIFY,
  GOAL_CLAIM,
  GOAL_EVADE,
  GOAL_SCOUT,
];
/*

 room domain goals

 design creep immediately produces creep specs which this room can produce

 defenses are secondary to infrastructure, work stealing will invert the priority when threats are near

 */
