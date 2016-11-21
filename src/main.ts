import * as CreepManager from "./components/creeps/creepManager";
import * as T from "./components/tasks";
import * as Config from "./config/config";
import MasterGoal from "./components/goals/highMasterGoal";
import GoalState from "./components/state/goalState";

console.log("loading");

const goals: MasterGoal = new MasterGoal();

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
  let initialPlan = goals.plan(state);
  let iteration = 0;

  while (initialPlan !== undefined) {
    console.log(++iteration, "planned", initialPlan.size());

    // prune conflicting goals
    const electedPlan = goals.elect(state, initialPlan);

    console.log(iteration, "elected", electedPlan.size());

    // execute goals
    const failedPlans = goals.execute(Game, state, electedPlan);

    console.log(iteration, "failed", failedPlans.length);

    // clean up failed or conflicting goals
    initialPlan = goals.resolve(failedPlans);
  }

  for (let i in Game.rooms) {
    let room: Room = Game.rooms[i];

    // legacy procedural ai
    CreepManager.run(room);
  }

  for (const fun of T.tasks) {
    fun();
  }

  // Clears any non-existing creep memory.
  for (let name in Memory.creeps) {
    if (!Game.creeps[name]) {
      console.log("Clearing non-existing creep memory: ", name);
      delete Memory.creeps[name];
    }
  }

  // TODO clear array?
  T.tasks.splice(0, T.tasks.length);

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
