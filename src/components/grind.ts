import * as F from "./functions";
import GlobalState from "./state/globalState";
import {log} from "./support/log";
import RoomState from "./state/roomState";
import CreepState from "./state/creepState";
import SourceState from "./state/sourceState";

export function grind(state: GlobalState) {
  // discover new rooms
  _.map(state.subject().rooms, RoomState.left);

  // scan existing rooms
  state.eachRoom((room) => {
    if (room.resolve()) {
      log.debug("TODO scan for new buildings and enemies", room);
      // TODO identify new buildings, new enemies
    } else {
      // TODO buildings and enemies should be identified, bootstrapping tasks done via callback
      log.debug("TODO logic for remote rooms");
    }
  });

  state.eachSpawn((spawn) => {
    const subject = spawn.subject();

    if (subject.room.energyAvailable >= 300) {
      spawnCreeps(state, subject);
    }
  });

  const tasked: any = {};
  let failed: any = {};

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
        // allocate worker, find closest, TODO prefer role=sourcer
        const creep = pos.findClosestByRange<Creep>(FIND_MY_CREEPS, { filter: (creep: Creep) => {
          if (creep.fatigue > 0) {
            // log.debug("tired");
            return false;
          }
          if (tasked[creep.id] !== undefined) {
            // log.info("already tasked");
            return false;
          }
          if (failed[creep.id] !== undefined) {
            log.info("failed");
            return false;
          }
          if (CreepState.left(creep).memory().working === undefined) {
            return true;
          }
          // log.debug("already working");
          return false;
        }});

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

    log.warning("idle creep", creep);
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
          failed[creepState.getId()] = sourceState.getId();
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
