import * as Config from "./config/config";
import { log } from "./components/support/log";
import GlobalState from "./components/state/globalState";
import {bootstrap} from "./components/bootstrap";
import {grind} from "./components/grind";
import {throttle} from "./components/util/throttle";
import monkeypatch from "./monkeypatch";
import {dispatchTick, detectChanges} from "./components/event/behaviorContext";
import {botMemory} from "./config/config";
import {importManager, scoreManager, maps} from "./components/singletons";

// Any code written outside the `loop()` method is executed only when the
// Screeps system reloads your script.
// Use this bootstrap wisely. You can cache some of your stuff to save CPU.
// You should extend prototypes before the game loop executes here.

monkeypatch();

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

let imported = false;

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

  const th = throttle();
  if (!th.isCpuOk()) {
    return;
  }

  try {
    const state = GlobalState.boot();

    if (!imported) {
      const bots = importManager.detect();
      log.debug("detected bots:", bots);
      imported = true;
    }

    maps.load(botMemory().maps);

    dispatchTick(Game.time);

    detectChanges(state, scoreManager);

    grind(state);
  } catch (err) {
    log.error("think failed", err);
    log.trace(err);
  }

  botMemory().maps = maps.store();

  if (Game.cpu.bucket !== undefined) {
    log.info(Game.cpu.getUsed(), "+", Game.cpu.bucket);
  }
}
