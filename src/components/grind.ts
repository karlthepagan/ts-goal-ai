import * as F from "./functions";
import GlobalState from "./state/globalState";
import {log} from "./support/log";
import CreepState from "./state/creepState";
import SourceState from "./state/sourceState";
import {throttle} from "./util/throttle";
import {scoreManager} from "./metrics/scoreSingleton";

export function grind(state: GlobalState) {
  const th = throttle();
  scoreManager.setContext(state);

  if (th.isRoomscanTime()) {
    // scan real rooms
    state.eachRoom((room) => {
      log.debug("TODO scan for new buildings and enemies", room);
      // TODO identify new buildings, new enemies
    });
  }

  if (th.isRescoreTime()) {
    log.info("rescoring game state");
    scoreManager.rescore(state, state.memory("score"), Game.time);
  }

  if (th.isVirtualRoomscanTime()) {
    let count = 0;
    state.eachVirtualRoom((room) => {
      if (!room.resolve()) {
        count++;
      }
    });
    log.debug("rooms without vision:", count);
  }

  state.eachSpawn((spawn) => {
    const subject = spawn.subject();

    if (subject.room.energyAvailable >= 300) {
      spawnCreeps(state, subject);
    }
  });

  const tasked: any = {};
  let failed: any;

  state.eachSource((source) => {
    const sites = source.nodeDirs();

    const workers = source.memory("workers");

    const dirToPosition = F.dirToPosition(source.pos());

    for (const site of sites) {

      const pos = dirToPosition(site);
      const worker = workers[site + ""];
      if (worker !== undefined) {
        // log.debug("resolving worker @", site, worker.id);
        // grab worker and mine!
        if (tryHarvest(CreepState.vright(worker.id), source, pos, site, tasked, failed)) {
          // log.debug("mined", site, "next site for", source);
          continue;
        }
      }

      let harvested = false;
      do {
        let creep: Creep|null = null;
        try {
          // allocate worker, find closest, TODO prefer role=sourcer
          creep = pos.findClosestByRange<Creep>(FIND_MY_CREEPS, {
            filter: (creep: Creep) => {
              if (creep.fatigue > 0) {
                // log.debug("tired");
                return false;
              }
              if (tasked[creep.id] !== undefined) {
                // log.info("already tasked");
                return false;
              }
              if (failed[creep.id] !== undefined) {
                log.info("failed:", failed[creep.id]);
                return false;
              }
              if (CreepState.left(creep).memory().working === undefined) {
                return true;
              }
              // log.debug("already working");
              return false;
          }}); // TODO tslint error, newlines produce a problem
        } catch (err) {
          // this is an expected exceptional case, no visibility to this source
          // TODO virtualFindClosestByRange? replace with a.getRangeTo(b)
          /*
           Error: Could not access room E69N17
           . (~/source-map/lib/util.js:301)
           .findClosestByRange (null:null)
           state.eachSource (src/components/grind.ts:57)
           _.map (src/components/state/globalState.ts:82)
           arrayMap (~/source-map/lib/array-set.js:6)
           Function.map (null:null)
           GlobalState.eachSource (src/components/state/globalState.ts:81)
           Object.grind (src/components/grind.ts:34)
           Object.loop (src/main.ts:56)
           __module (null:null)
           */
          // log.debug("findClosestByRange", err);
        }

        if (creep === null) {
          // log.error("no worker found");
          break;
        }

        const creepState = CreepState.left(creep);
        creepState.memory().working = source.getId();

        harvested = tryHarvest(creepState, source, pos, site, tasked, failed);
      } while (!harvested);
    }
  });

  state.eachCreep((creep) => {
    if (tasked[creep.getId()] !== undefined) {
      return;
    }

    log.info("idle creep", creep);
  });
  // let creeps = state.creeps();

  // let creeps = this._identifyResources(state);
  //
  // // let carriers = creeps.filter( (c) => { return Tasks.isEnergyFull(c, 0.8); });
  // // && !CreepState.right(c).isAllocated();
  // for (const worker of creeps) {
  //   if (!Tasks.isEnergyFull(worker, 0.8)) {
  //     continue;
  //   }
  //   const workState = CreepState.left(worker);
  //   const spawn = worker.pos.findClosestByRange<Spawn>(FIND_MY_SPAWNS, {filter: (s: Spawn) => {
  //     return !Tasks.isSpawnFull(s, 1);
  //   }});
  //
  //   if (spawn != null) {
  //     const job = worker.transfer(spawn, "energy", worker.carry.energy);
  //     if (job !== 0) {
  //       worker.say(job + "d" + worker.moveTo(spawn.pos));
  //     } else {
  //       delete creeps[creeps.indexOf(worker)];
  //     }
  //   } else {
  //     console.log(workState, "can't find spawn");
  //   }
  // }
  //
  // state.forEachSource( (sourceState) => {
  //   let sites = sourceState.locations();
  //   // nextSite:
  //   for (const site of sites) {
  //     const worker = site.findClosestByRange<Creep>(FIND_MY_CREEPS, {filter: (c: Creep) => {
  //       return !Tasks.isEnergyFull(c, 0.8); // && !CreepState.right(c).isAllocated();
  //     }});
  //
  //     if (worker !== null) {
  //       delete creeps[creeps.indexOf(worker)];
  //       if (worker.pos.isEqualTo(site)) {
  //         // mine source
  //         sourceState.allocate(CreepState.left(worker), site);
  //         const job = sourceState.harvestFrom(worker);
  //         if (job !== 0) {
  //           worker.say("e" + job);
  //         }
  //       } else {
  //         const move = worker.moveTo(site);
  //         if (move !== 0) {
  //           worker.say("m" + move);
  //         }
  //       }
  //     } else {
  //       console.log("no worker for", site);
  //     }
  //   }
  // });
  //
  // creeps = creeps.filter((c) => { return c !== undefined; });
  //
  // for (const creep of creeps) {
  //   if (creep !== undefined) {
  //     creep.say("?");
  //   }
  // }
}

function spawnCreeps(state: GlobalState, spawn: Spawn) {
  state = state;

  log.info("I want to spawn creeps!", spawn);
  // spawn.createCreep([WORK, WORK, CARRY, MOVE]);
}

function tryHarvest(creepState: CreepState, sourceState: SourceState,
                    pos: RoomPosition, site: number,
                    tasked: any, failed: any): boolean {

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
          log.debug("tired", creepState);
          failed[creepState.getId()] = "fatigue";
        }
    }

    const worker = F.expand( [ site + "" ], sourceState.memory("workers") );
    worker.id = creep.id;
    tasked[creep.id] = sourceState.getId();
    return true;
  } else {
    log.debug("worker died?");
    F.deleteExpand( [ site + ""], sourceState.memory("workers") );
    failed[creepState.getId()] = sourceState.getId();
    return false;
  }
}
