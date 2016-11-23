import * as Config from "./config/config";
import GoalState from "./components/state/goalState";
import {bootstrap} from "./components/bootstrap";
import Plan from "./components/goals/plan";
import ManualGoal from "./components/goals/zeroManualGoal";

console.log("loading");

for ( let f of bootstrap ) {
  f();
}

const goals = new ManualGoal();
const root = Plan.ROOT;

/**
 * Screeps system expects this "loop" method in main.js to run the
 * application. If we have this line, we can be sure that the globals are
 * bootstrapped properly and the game loop is executed.
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * @export
 */
export function loop() {
  // initialize working memory
  const state = GoalState.boot();

  // plan level zero
  let initialPlan = goals.plan(root, state);
  let iteration = 0;

  while (initialPlan !== undefined && initialPlan.length > 0) {
    console.log("gen", ++iteration, "planned", Plan.size(initialPlan));

    // prune conflicting goals
    const electedPlan = goals.elect(state, initialPlan);

    console.log("gen", iteration, "elected", Plan.size(electedPlan));

    // execute goals
    const failedPlans = goals.execute(Game, electedPlan);

    console.log("gen", iteration, "failed", failedPlans.length);

    // clean up failed or conflicting goals
    initialPlan = goals.resolve(root, failedPlans);
  }

  // Clears any non-existing creep memory.
  for (let name in Memory.creeps) {
    if (!Game.creeps[name]) {
      console.log("Clearing non-existing creep memory: ", name);
      delete Memory.creeps[name];
    }
  }

  console.log("CPU: ", Game.cpu.getUsed());
  loading = false;
}

let loading: boolean = true;

// This is an example for using a config variable from `config.ts`.
if (Config.USE_PATHFINDER) {
  PathFinder.use(true);
}

RoomObject.prototype.getMemory = function() {
  let mem: any|undefined = Memory.objects[this.id];
  if (mem === undefined) {
    // console.log("create memory ", this);
    return Memory.objects[this.id] = {};
  }
  return mem;
};

Creep.prototype.getMemory = function() {
  return this.memory;
};

Flag.prototype.getMemory = function() {
  return this.memory;
};

Spawn.prototype.getMemory = function() {
  return this.memory;
};

OwnedStructure.prototype.getMemory = function() {
  return this.memory;
};

StructureController.prototype.getMemory = RoomObject.prototype.getMemory;

Room.prototype.getMemory = function() {
  return this.memory;
};
