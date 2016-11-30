import * as F from "./functions";
import GlobalState from "./state/globalState";
import {log} from "./support/log";
import CreepState from "./state/creepState";
import SourceState from "./state/sourceState";
import {throttle} from "./util/throttle";
import {scoreManager} from "./score/scoreSingleton";
import {SCORE_KEY} from "./score/scoreManager";
import State from "./state/abstractState";
import {DISTANCE_WEIGHT} from "./score/stateScoreProvider";

export function grind(state: GlobalState) {
  const commands = state.memory() as Commands;
  const opts = state.memory("config") as Options;

  if (commands.shuffle || commands.last === undefined
      || (Game.time - commands.last) > F.elvis(opts.failedTicksToShuffle, 5)) {
    resetAssignments(state, commands.shuffle);
    delete commands.shuffle;
  }

  const th = throttle();
  scoreManager.setContext(state);

  if (opts.respawn || opts.suicide) {
    // stop aggressive scanning unless cpu bucket is over 85% full
    let scan = Game.cpu.bucket > 8500;
    doScans(state, true, scan, scan); // always roomscan to pickup new enemies
  } else {
    doScans(state, th.isRoomscanTime(), th.isRescoreTime(), th.isRemoteRoomScanTime());
  }

  const creeps = _.values<Creep|null>(Game.creeps);
  // tasked is useful for double-checking my accounting
  const tasked: { [creepIdToSourceId: string]: string } = {};

  if (!commands.pause) {
    doSpawn(state, opts);

    doHarvest(state, creeps, tasked);

    doIdle(state, opts, creeps, tasked);
  }

  commands.last = Game.time;
}

function doIdle(state: GlobalState, opts: Options, creeps: (Creep|null)[], tasked: any) {
  state = state;
  opts = opts;
  tasked = tasked;

  _.chain(creeps).compact().map((creep: Creep) => {
    creep.say("?", false);
  }).value();
}

/**
 * transform State -> memory -> extract score -> decorate score using State
 */
function byScore<T extends State<any>>(metric: string, decorator?: (acc: number, s: T) => number) {

  const scorer = scoreManager.byScore(metric);

  // DRY is a nontrivial cost
  if (decorator === undefined) {
    return (s: T) => {
      // log.info("byScore input", s);
      const mem = s.memory(SCORE_KEY);
      const score = scorer(mem);
      // log.info("byScore result", score);
      return score;
    };
  }

  /* TODO functional? more expressive, why not just use comments? :P
   _.flow(
   (s: T) => s.memory(SCORE_KEY),
   scoreManager.byScore(score)
   ) as (s: T) => number;
   */
  return (s: T) => {
    // log.info("byScore input", s);
    const mem = s.memory(SCORE_KEY);
    const score = scorer(mem);
    // log.info("byScore middle", score);
    const decorated = decorator(score, s);
    // log.info("byScore result", decorated);
    return decorated;
  };
}

// state/tenergy
const tenergyScore = byScore("tenergy");

// creep/venergy + rangeScore
const distanceEnergyFitness = (pos: RoomPosition) => {
  return byScore("venergy", (score: number, s: State<any>) => {
    // do not give venergy: 0 creeps any distance score
    if (score === 0) {
      return 0;
    }
    return score + DISTANCE_WEIGHT / F.rangeScore(s.pos(), pos);
  });
};

// function tapLog<T>(message: string): (s: T) => T {
//   return (s) => {
//     log.info(message, s);
//     return s;
//   };
// }

function isTrue(prev: number, curr: any) {
  return curr ? (prev + 1) : prev;
}

// TODO - you don't need _.chain, lodash says that flow/flowRight avoids intermediates / "shortcut fusion" even with FP
const compactSize = _.curryRight(_.foldl, 3)(0)(isTrue) as (x: any[]) => number;

function str(x: any, f: (x: any) => string|number): {} {
  return {
    toString: () => f(x),
  };
}

function doHarvest(state: GlobalState,
                   creeps: (Creep|null)[],
                   tasked: { [creepIdToSourceId: string]: string }): (SourceState|null)[] {

  // TODO well shit
  /*
   TypeError: Cannot read property '1' of undefined
   state.sources.groupBy.pairs.filter.sortBy.map.flatten.map (src/components/grind.ts:189)
   at arrayMap (E:\SteamLibrary\steamapps\common\Screeps\server\node_modules\lodash\index.js:1406:25)
   at map (E:\SteamLibrary\steamapps\common\Screeps\server\node_modules\lodash\index.js:6710:14)
   at interceptor (E:\SteamLibrary\steamapps\common\Screeps\server\node_modules\lodash\index.js:12240:26)
   at thru (E:\SteamLibrary\steamapps\common\Screeps\server\node_modules\lodash\index.js:5927:26)
   at baseWrapperValue (E:\SteamLibrary\steamapps\common\Screeps\server\node_modules\lodash\index.js:2768:30)
   at LazyWrapper.lazyValue [as value] (E:\SteamLibrary\steamapps\common\Screeps\server\node_modules\lodash\index.js:
   at baseWrapperValue (E:\SteamLibrary\steamapps\common\Screeps\server\node_modules\lodash\index.js:2761:25)
   at LodashWrapper.wrapperValue (E:\SteamLibrary\steamapps\common\Screeps\server\node_modules\lodash\index.js:6124:14)
   doHarvest (src/components/grind.ts:214)
   */

  // TODO compact<SourceState> should remove null|undefined
  return state.sources()
      .groupBy(tenergyScore).pairs().filter((it) => +it[0] > 0).sortBy(0).map(1).flatten()
    // TODO - CRITICAL - memoize statement thus far until closer source or destination is discovered
    // this is called an election!
      .map((source: SourceState) => {
    let failed: any = {};
    const sites = source.nodeDirs();

    const workers = source.memory("workers", true);

    const dirToPosition = F.dirToPosition(source.pos());

    for (const site of sites) {

      const pos = dirToPosition(site);
      const energyScore = distanceEnergyFitness(pos);
      const byRangeToSite = F.byStateRangeTo(pos);
      const worker = workers[ site ];
      if (worker !== undefined) {
        // log.debug("resolving worker @", site, worker);
        // grab worker and mine!
        const creep = CreepState.vright(worker);
        if (tryHarvest(creep, source, pos, site, tasked, failed)) {
          // log.debug("mined", site, "next site for", source);
          creeps[creeps.indexOf(creep.subject())] = null;
          continue;
        }
      }

      // log.info("allocating", source, "site", site);
      let harvested = false;
      do {
        // allocate worker, find closest, TODO prefer role=sourcer? look up bot compat?

        log.debug(str(creeps, compactSize), "left");
        let candidates = _.chain(creeps).compact().map(CreepState.right).filter((cs: CreepState) => {
          const creep = cs.subject();
          const taskId = tasked[creep.id];
          if (taskId !== undefined && taskId !== source.getId()) {
            log.warning("already tasked", cs);
            return false;
          }
          if (failed[creep.id] !== undefined) {
            log.info("failed:", failed[creep.id], creep.name);
            return false;
          }
          const working = CreepState.left(creep).memory().working;
          if (working !== undefined && working !== source.getId()) {
            // log.debug("already working", creep.name);
            return false;
          }
          return true;
        }).groupBy(energyScore).pairs().sortBy(0).last().valueOf() as any[];
        // first score by fitness (body + distance)

        // log.debug(candidates[1].length, "creep candidates score:", candidates[0]);
        // then tie-break by range to site
        let creep = _.chain(candidates[1] as CreepState[]).sortBy(byRangeToSite).first().valueOf() as CreepState;

        if (creep === null || creep === undefined) {
          log.error("no worker found");
          return source;
        }

        creep.lock();
        if (creep.memory().working !== undefined) {
          // free current source
          const oldsite: string[] = SourceState.vleft(creep.memory().working).memory("workers", true);
          delete oldsite[oldsite.indexOf(creep.getId())];
        }
        creep.memory().working = source.getId();

        harvested = tryHarvest(creep, source, pos, site, tasked, failed);
        creep.release();

        if (harvested) {
          creeps[creeps.indexOf(creep.subject())] = null;
        }
      } while (!harvested);
    }

    return null;
  }).compact().value();
}

function doScans(state: GlobalState, roomScan: boolean, rescore: boolean, remoteRoomScan: boolean) {
  if (roomScan) {
    // scan real rooms
    state.eachRoom((room) => {
      // room.subject().find(FIND_HOSTILE_CREEPS)
      log.debug("TODO scan for new buildings and enemies", room);
      // TODO identify new buildings, new enemies
    });
  }

  if (rescore) {
    log.info("rescoring game state");
    scoreManager.rescore(state, state.memory(SCORE_KEY), undefined, Game.time);
  }

  if (remoteRoomScan) {
    let count = 0;
    state.eachRemoteRoom((room) => {
      if (!room.resolve()) {
        count++;
      }
    });
    log.debug("rooms without vision:", count);
  }
}

function doSpawn(state: GlobalState, commands: Options) {
  commands = commands;

  state.eachSpawn((spawn) => {
    const subject = spawn.subject();

    if (subject.room.energyAvailable >= 300) {
      spawnCreeps(state, subject);
    }
  });
}

function spawnCreeps(state: GlobalState, spawn: Spawn) {
  state = state;

  log.info("I want to spawn creeps!", spawn);
  // spawn.createCreep([WORK, WORK, CARRY, MOVE]);
}

function tryHarvest(creepState: CreepState, sourceState: SourceState,
                    pos: RoomPosition, site: number,
                    tasked: { [creepIdToSourceId: string]: string }, failed: any): boolean {

  if (creepState.resolve()) {
    const range = creepState.pos().getRangeTo(pos);
    // log.info("harvesting", creepState, creepState.pos(), "to", sourceState, pos, "range", range);
    const creep = creepState.subject();
    switch (range) {
      case 0:
        if (!sourceState.resolve()) {
          log.error("failed to resolve", sourceState);
          return false;
        }
        const mineResult = creep.harvest(sourceState.subject());
        if (mineResult !== 0) {
          log.debug("harvest failed", sourceState, "moveTo=", mineResult, creepState);
        }
        break;

      default:
        // TODO pathing when range > 1
        if (creep.fatigue === 0) {
          const moveResult = creep.moveTo(pos);
          if (moveResult !== 0) {
            log.debug("move failed", sourceState, "moveTo=", moveResult, creepState);
          }
        } else {
          // log.debug("tired", creepState);
          failed[creepState.getId()] = "fatigue";
        }
    }

    sourceState.memory("workers", true)[ site ] = creep.id;
    tasked[creep.id] = sourceState.getId();
    // log.debug("tasked", creep.id, "to", sourceState.getId());
    return true;
  } else {
    // TODO release task and send another worker
    log.info("died?", creepState);
    delete sourceState.memory("workers", true)[ site ];
    failed[creepState.getId()] = sourceState.getId();
    return false;
  }
}

function resetAssignments(state: GlobalState, shuffled: boolean) {
  if (shuffled) {
    log.warning("resetting creep assignments");
  } else {
    log.error("recovering from failing activity or foreign branch");
  }
  state.sources().filter((s) => delete s.memory().workers).value();
  state.creeps().filter((s) => delete s.memory().working).value();
}
