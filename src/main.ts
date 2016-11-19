import * as CreepManager from "./components/creeps/creepManager";
import * as T from "./components/tasks";
import * as Look from "./components/look";
import * as Config from "./config/config";

// Any code written outside the `loop()` method is executed only when the
// Screeps system reloads your script.
// Use this bootstrap wisely. You can cache some of your stuff to save CPU.
// You should extend prototypes before the game loop executes here.

console.log("loading");
let loading: boolean = true;

// This is an example for using a config variable from `config.ts`.
if (Config.USE_PATHFINDER) {
  PathFinder.use(true);
}

RoomObject.prototype.getMemory = function() {
  let mem: any|undefined = Memory.objects[this.id];
  if (mem === undefined) {
    console.log("create memory ", this);
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

/**
 * Screeps system expects this "loop" method in main.js to run the
 * application. If we have this line, we can be sure that the globals are
 * bootstrapped properly and the game loop is executed.
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * @export
 */
export function loop() {
  Look.init();

  for (let i in Game.rooms) {
    let room: Room = Game.rooms[i];

    Look.atRoom(room);

    CreepManager.run(room);

    // Clears any non-existing creep memory.
    for (let name in Memory.creeps) {
      let creep: any = Memory.creeps[name];

      if (creep.room === room.name) {
        if (!Game.creeps[name]) {
          console.log("Clearing non-existing creep memory: ", name);
          delete Memory.creeps[name];
        }
      }
    }
  }

  for (const fun of T.tasks) {
    fun();
  }

  // TODO clear?
  T.tasks.splice(0, T.tasks.length);

  console.log("CPU: ", Game.cpu.getUsed());
  loading = false;
}
