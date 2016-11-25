import * as Config from "./config/config";
// import * as F from "./components/functions";

import { log } from "./components/support/log";
import GlobalState from "./components/state/globalState";
import {bootstrap} from "./components/bootstrap";
import {grind} from "./components/grind";

// Any code written outside the `loop()` method is executed only when the
// Screeps system reloads your script.
// Use this bootstrap wisely. You can cache some of your stuff to save CPU.
// You should extend prototypes before the game loop executes here.

// This is an example for using a config variable from `config.ts`.
if (Config.USE_PATHFINDER) {
  PathFinder.use(true);
}

log.info("load");

for (const f of bootstrap) {
  f();
}

// TODO consider refactor to register config per-mod

// TODO register promises and callbacks in bootstrap

// TODO game local memory, benchmark impact on CPU

/**
 * Screeps system expects this "loop" method in main.js to run the
 * application. If we have this line, we can be sure that the globals are
 * bootstrapped properly and the game loop is executed.
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * @export
 */
export function loop() {
  // Check memory for null or out of bounds custom objects
  if (!Memory.uuid || Memory.uuid > 100) {
    Memory.uuid = 0;
  }

  const bucket = Game.cpu.bucket;
  if (bucket < 200) {
    log.error("critical bucket:", bucket);
    return;
  } else if (bucket < 5000) {
    log.warning("bucket:", bucket);
  }

  try {
    const state = GlobalState.boot();

    grind(state);
  } catch (err) {
    log.error("think failed", err);
    log.trace(err);
  }

  for (let i in Game.rooms) {
    let room: Room = Game.rooms[i];

    // Clears any non-existing creep memory.
    for (let name in Memory.creeps) {
      let creep: any = Memory.creeps[name];

      if (creep.room === room.name) {
        if (!Game.creeps[name]) {
          log.info("Clearing non-existing creep memory:", name);
          delete Memory.creeps[name];
        }
      }
    }
  }

  log.info(Game.cpu.getUsed(), "+", Game.cpu.bucket);
}
