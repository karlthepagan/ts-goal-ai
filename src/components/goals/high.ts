export const GOAL_DESIGN = "design";
export const GOAL_FLAG = "flag"; // TODO
export const GOAL_STICKY = "sticky"; // TODO
export const GOAL_MASTER = "think";
export const GOAL_DEFEND = "defend"; // TODO
export const GOAL_GCL = "gcl";
export const GOAL_EXPAND = "expand";
export const GOAL_ATTACK = "attack"; // TODO
export const GOAL_IDLE = "idle"; // TODO
/*

 game domain goals

 design calculates available resources and builds a library of available things in working memory

 flag is an interruptor

 sticky is a high priority goal which selects outstanding goals,  missions and executes them

 RCL should consume AI priority until it is adventageous to expand

 idle goal moves creeps to where they will be needed (heat map etc?)

 from @warinternal for RUN DEV PHASE
 I suggest somewhere in there you have a room-maintenance mode where you severely limit the energy you put
 into the controller if you're in an emergency condition or need it elsewhere, like wartime operations.  At
 RCL 8 for instance, you're bringing in 20 ept for the room from two sources, and capped to 15 ept into the
 controller, leaving you with 5 for anything else. You can reduce upgrader to 1 work part and have 19 ept
 for everything, or since you get 100k or more ticks till downgrade you can just _not_ upgrade if you're
 need that energy badly

 I aim for 100 to 300k, and turn extra things on or off if I have reserve

 whenever i respawn, i have a global function that runs that, and loops through all my Flag's and remove()s them
 for a fresh restart
 */
