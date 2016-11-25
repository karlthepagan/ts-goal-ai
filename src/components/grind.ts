import GlobalState from "./state/globalState";
import {log} from "./support/log";
import RoomState from "./state/roomState";
export function grind(state: GlobalState) {
  state = state;

  log.debug("grind");

  // scan existing rooms
  state.rooms((room) => {
    if (room.resolve()) {
      log.debug("TODO scan for new buildings and enemies", room);
      // TODO identify new buildings, new enemies
    } else {
      log.warning("resolve failed", room);
    }
  });

  // discover new rooms
  _.forEach(state.subject().rooms, RoomState.left);
  // TODO buildings and enemies should be identified, bootstrapping tasks done via callback

  state.spawns((spawn) => {
    if (spawn.resolve()) {
      const subject = spawn.subject();

      if (subject.energy >= 300) {
        spawnCreeps(state, subject);
      }
    } else {
      log.warning("resolve failed", spawn);
    }
  });

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

  spawn.createCreep([WORK, WORK, CARRY, MOVE]);
}
