export const GOAL_ASSASSINATE = "assassin"; // TODO
export const GOAL_DESIGN = "design";
export const GOAL_INFRASTRUCTURE = "infrastructure";
export const GOAL_FORTIFY = "fortify";
export const GOAL_RCL = "rcl";
export const GOAL_CLAIM = "claim";
export const GOAL_SCOUT = "scout";
export const GOAL_EVADE = "evade"; // avoid enemies
export const GOAL_ENERGY_VELOCITY = "energyVelocity";

export const priority: string[] = [
  GOAL_ENERGY_VELOCITY,
  GOAL_INFRASTRUCTURE,
  GOAL_FORTIFY,
  GOAL_CLAIM,
  GOAL_EVADE,
  GOAL_SCOUT,
];
/*

 room domain goals

 goal assassin is assigned attacks, they consume priority

 defenses are secondary to infrastructure, work stealing will invert the priority when threats are near

 */
