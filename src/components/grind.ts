import * as F from "./functions";
import GlobalState from "./state/globalState";
import {log} from "./support/log";
import CreepState from "./state/creepState";
import SourceState from "./state/sourceState";
import {throttle} from "./util/throttle";
import {scoreManager} from "./score/scoreSingleton";
import {SCORE_KEY} from "./score/scoreManager";
import State from "./state/abstractState";
import {DISTANCE_WEIGHT} from "./impl/stateScoreProvider";
import MemoIterator = _.MemoIterator;
import LookForIterator from "./util/lookForIterator";
import {FindCallback} from "./util/lookForIterator";
import api from "./event/behaviorContext";
import {isReal} from "./functions";
import StructureState from "./state/structureState";

const cachedIdleActions: { [id: string]: FindCallback<any> } = {};

export function grind(state: GlobalState) {
  const commands = state.memory() as Commands;
  const opts = state.memory("config") as Options;

  if (commands.break) {
    debugger; // break command
    delete commands.break;
  }

  if (commands.shuffle || commands.last === undefined
      || (Game.time - commands.last) > F.elvis(opts.failedTicksToShuffle, 5)) { // TODO integrate into event manager
    resetAssignments(state, commands.shuffle);
    delete commands.shuffle;
  }

  const th = throttle();
  scoreManager.setContext(state);

  if (opts.respawn || opts.suicide) {
    // stop aggressive scanning unless cpu bucket is over 85% full
    let scan = Game.cpu.bucket > 8500;
    doScans(state, true, scan, scan, commands); // always roomscan to pickup new enemies
  } else {
    doScans(state, th.isRoomscanTime(), th.isRescoreTime(), th.isRemoteRoomScanTime(), commands);
  }

  const creeps = _.values<Creep|null>(Game.creeps).filter(i => !(i === null || i.ticksToLive === undefined));
  // tasked is useful for double-checking my accounting
  const tasked: { [creepIdToSourceId: string]: string } = {};

  if (!commands.pause) {

    if (creeps.length > 0) {
      if (commands.hardxfer) {
        doTransfers(state, creeps, tasked);
      }

      doHarvest(state, creeps, tasked);

      if (commands.hardidle) {
        doIdle(state, opts, creeps, tasked);
      }
    }

    doSpawn(state, opts);
  }

  commands.last = Game.time;
}

export function doIdle(state: GlobalState, opts: Options, creeps: (Creep|null)[], tasked: any) {
  state = state;
  opts = opts;
  tasked = tasked;

  _.chain(creeps).compact().map((creep: Creep) => {
    const action = cachedIdleActions[creep.id];
    if (action !== undefined) {
      let result = false;
      if (action.value !== undefined) {
        const target = Game.getObjectById(action.target as string);
        result = target === undefined ? false : action.value.call(creep, target);
      }
      if (result) {
        delete cachedIdleActions[creep.id];
      } else {
        creeps[creeps.indexOf(creep)] = null;
      }
    }
  });

  // _.chain(creeps).compact().map((creep: Creep) => {
  //   // keep moving
  //   if (creep.memory._move !== undefined) {
  //     const dest = creep.memory._move.dest;
  //     creep.moveTo(new RoomPosition(dest.x, dest.y, dest.name)); // TODO creep state, wrap with api(state).moveTo
  //
  //     creeps[creeps.indexOf(creep)] = null;
  //   }
  // }).value();

  // gather energy
  _.chain(creeps).compact().filter(energyFull(0.8)).sortBy(energy).map((creep: Creep) => {

    LookForIterator.search<Creep>(creep.pos, 3, creep, [{
      key: LOOK_CREEPS,
      value: (other: Creep, range: number, self: Creep) => {
        if (range < 0) {
          return true;
        }
        let result = 0;
        const otherState = CreepState.left(other);
        if (otherState.memory().working !== undefined) {
          result = api(otherState).transfer(self, RESOURCE_ENERGY);
        } else if (energy(other) > 5) {
          result = api(otherState).transfer(self, RESOURCE_ENERGY, Math.ceil(energy(other) * 0.2));
        }
        if (result !== 0) {
          log.debug("transfer", result);
        }
        return true;
      },
    }, {
      key: LOOK_ENERGY,
      value: (resource: Resource, range: number, self: Creep) => {
        range = range;
        if (self.pickup(resource) === 0) {
          self.say("🔆", false);
          return false;
        }
        return true;
      },
    }], (found: any, callback: FindCallback<Creep>) => {

      callback.target = found.id as string;
      cachedIdleActions[creep.id] = callback as FindCallback<any>;
      creeps[creeps.indexOf(creep)] = null;
      return false;
    });

    return creep;
  }).value();

  // spend energy
  _.chain(creeps).compact().filter(energyEmpty(10)).sortBy(energy).reverse().map((creep: Creep) => {

    LookForIterator.search<Creep>(creep.pos, 3, creep, [{
      key: LOOK_CONSTRUCTION_SITES,
      value: (site: ConstructionSite) => {
        if (!site.my) {
          return true; // TODO fight?
        }

        creep.build(site);
        if (!creep.pos.isNearTo(site.pos)) {
          api(CreepState.left(creep)).move(creep.pos.getDirectionTo(site.pos));
        }
        creep.say("📐", false);
        return false;
      },
    }, {
      key: LOOK_STRUCTURES,
      value: (structure: OwnedStructure) => {
        if (structure.hits < structure.hitsMax) {
          creep.repair(structure);
          creep.say("🔨", false);
          return false;
        }
        return true;
      },
    }], (found: any, callback: FindCallback<Creep>) => {

      callback.target = found;
      cachedIdleActions[creep.id] = callback as FindCallback<any>;
      creeps[creeps.indexOf(creep)] = null;
      return false;
    });

    return creep;
  }).value();

  _.chain(creeps).compact().map((creep: Creep) => {
    // dunno
    creep.say("?", false);
  }).value();
}

/**
 * transform State -> memory -> extract score -> decorate score using State
 */
function byScore<T extends State<any>>(metric: string, decorator?: MemoIterator<any, number> ): ScoreFunc<T> {

  const scorer = scoreManager.byScore(metric);

  // DRY is a nontrivial cost
  if (decorator === undefined) {
    return (value: T) => {
      // log.info("byScore input", s);
      const mem = value.memory(SCORE_KEY);
      const score = scorer(mem);
      // log.info("byScore result", score);
      return {value, score};
    };
  }

  /* TODO functional? more expressive, why not just use comments? :P
   _.flow(
   (s: T) => s.memory(SCORE_KEY),
   scoreManager.byScore(score)
   ) as (s: T) => number;
   */
  return (value: T) => {
    // log.info("byScore input", s);
    const mem = value.memory(SCORE_KEY);
    let score = scorer(mem);
    // log.info("byScore middle", score);
    score = decorator(score, value);
    // log.info("byScore result", decorated);
    return {value, score};
  };
}

/**
 * @param state wants more energy! go get it
 * @param ignore don't steal from these id's
 */
export function doQuickTransfers(state: State<any>, ignore: any): void {
  ignore[state.getId()] = true;
  if (state.isEnergyMover()) {
    // creeps can withdraw
    const creep = state as CreepState;
    creep.touchedStorage().value().forEach(c => {
      if (!isReal(ignore[c.getId()])) {
        return;
      }
      debugger; // TODO REMOVE quick transfers from storage
      c.resolve();
      api(creep).withdraw(c.subject(), RESOURCE_ENERGY);
      doQuickTransfers(c, ignore);
    });
    state.touchedCreepIds().reject(F.onKeys(ignore)).map(CreepState.vright).value().forEach(c => {
      c.resolve();
      api(c).transfer(state.subject(), RESOURCE_ENERGY);
      // TODO don't ignore unless full?
      ignore[c.getId()] = true;
      doQuickTransfers(c, ignore);
    });
  } else {
    // structures have to find creep neighbors
    state.touchedCreepIds().reject(F.onKeys(ignore)).map(CreepState.vright).value().forEach(c => {
      c.resolve();
      api(c).transfer(state.subject(), RESOURCE_ENERGY);
      // TODO don't ignore unless full?
      ignore[c.getId()] = true;
      doQuickTransfers(c, ignore);
    });
  }
}

// TODO planned transfers, calculate venergy of all participants and move to meet deadline

export function doTransfers(state: GlobalState,
                            creeps: (Creep|null)[],
                            tasked: { [creepIdToSourceId: string]: string }): (StructureState<any>|null)[] {
  if (compactSize(creeps) === 0) {
    return [];
  }
  tasked = tasked;

  return state.spawns().map(structureState => {
    const spawn = structureState.subject();
    if (spawn.energy < spawn.energyCapacity) {
      // energy hungry, feed me!
      LookForIterator.search<OwnedStructure>(spawn.pos, 3, spawn, [{
        key: LOOK_CREEPS,
        value: (other: Creep, range: number, self: OwnedStructure) => {
          if (range < 0) {
            return true;
          }
          let result = 0;
          const otherState = CreepState.left(other);
          if (otherState.memory().working !== undefined) {
            result = api(otherState).transfer(self, RESOURCE_ENERGY);
          } else if (energy(other) > 5) {
            result = api(otherState).transfer(self, RESOURCE_ENERGY, Math.ceil(energy(other) * 0.2));
          }
          if (result !== 0) {
            log.debug("transfer", result);
          }
          return true;
        },
      }]);
    }
    return structureState;
  }).value();
}

export function doHarvest(state: GlobalState,
                          creeps: (Creep|null)[],
                          tasked: { [creepIdToSourceId: string]: string }): (SourceState|null)[] {

  if (compactSize(creeps) === 0) {
    return [];
  }
  // TODO compact<SourceState> should remove null|undefined in the parameterized type
  return state.sources().map(scoreTEnergy).filter(it => it.score > 0).sortBy("score").reverse()
    // TODO - CRITICAL - memoize statement thus far until closer source or destination is discovered
    // this is called an election!
    .map(({value, score}) => {

      score = score;
      const source: SourceState = value;
      let failed: any = {};

      const dirToPosition = F.dirToPositionCall(source.pos());
      const scoreEnergy = distanceEnergyFitness(source.pos());

      const workers = source.memory("workers", true);
      for (let site = workers.length - 1; site >= 0; site--) {
        const worker = workers[site];
        if (worker) {
          const pos = dirToPosition(site);

          // grab worker and mine!
          const creep = CreepState.vright(worker);
          if (tryHarvest(creep, source, pos, site, tasked, failed)) {
            // log.debug("mined", site, "next site for", source);
            creeps[creeps.indexOf(creep.subject())] = null;
          } else {
            // TODO clean up assignment codes
            delete workers[site];
          }
        }
      }

      // log.debug(F.str(creeps, compactSize), "left"); // number before candidate processing

      let candidates = _.chain(creeps).compact().filter((creep: Creep) => {
        const taskId = tasked[creep.id];
        if (taskId !== undefined && taskId !== source.getId()) {
          log.warning("already tasked", creep);
          return false;
        }
        if (failed[creep.id] !== undefined) {
          log.info("failed:", failed[creep.id], creep.name);
          return false;
        }
        return true;
      }).map(CreepState.build).filter((cs: CreepState) => {
        const working = cs.memory().working;
        if (working !== undefined && working !== source.getId()) {
          // log.debug("already working", creep.name);
          return false;
        }
        return true;
      }).map(scoreEnergy).sortBy(it => it.score).reverse().value();
      // highest score by fitness (body + distance)

      if (candidates === undefined || candidates.length === 0) {
        // no creeps to harvest this source!
        return source;
      }

      log.debug(candidates.length, "left");

      let sites = source.nodeDirs();
      // special quick start ranking!
      if (creeps.length === 1 && _.size(Game.spawns) === 1) {
        sites = _.chain(source.nodeDirs())
          .map(dirToPosition)
          .sortBy(F.byPosRangeTo(_.values<Spawn>(Game.spawns)[0].pos))
          .map(F.posToDirection(source.pos())).value();
      }

      for (const site of sites) {

        const worker = workers[site];
        if (worker) {
          continue;
        }

        const pos = dirToPosition(site);
        const byRangeToSite = F.byStateRangeTo(pos);

        // log.info("allocating", source, "site", site);
        let harvested = false;
        do {
          // allocate worker, find closest, TODO prefer role=sourcer? look up bot compat?

          // log.debug(candidates[1].length, "creep candidates score:", candidates[0]);
          // then tie-break by range to site
          let creep = _.chain(candidates).map(it => it.value).sortBy(byRangeToSite).first().valueOf() as CreepState;

          if (creep === null || creep === undefined) {
            log.error("no worker found");
            return source;
          }

          creep.lock();
          if (creep.memory().working !== undefined) {
            // free current source
            freeCreep(creep);
          }

          harvested = tryHarvest(creep, source, pos, site, tasked, failed);
          creep.release();

          if (harvested) {
            creeps[creeps.indexOf(creep.subject())] = null;
            return null;
          }
        } while (!harvested);
      }

      return null;
    }
  ).compact().value();
}

function doScans(state: GlobalState, roomScan: boolean, rescore: boolean, remoteRoomScan: boolean, commands: Commands) {
  if (roomScan) {
    // scan real rooms
    state.eachRoom(room => {
      // room.subject().find(FIND_HOSTILE_CREEPS)
      log.debug("TODO scan for new buildings and enemies", room);
      // TODO identify new buildings, new enemies
    });
  }

  if (rescore) {
    if (commands.debugScore) {
      debugger; // command.debugScore
    }
    log.info("rescoring game state");
    scoreManager.rescore(state, state.memory(SCORE_KEY), undefined, Game.time);
  }

  if (remoteRoomScan) {
    let count = 0;
    state.eachRemoteRoom(room => {
      if (!room.resolve()) {
        count++;
      }
    });
    log.debug("rooms without vision:", count);
  }
}

export function doSpawn(state: GlobalState, commands: Options) {
  commands = commands;

  return state.spawns().map(structureState => {
    spawnCreeps(state, structureState);
  }).value();
}

const movePartCost = BODYPART_COST.move;
const carryPartCost = BODYPART_COST.move;
const workerBody = [CARRY, WORK, MOVE, MOVE];
const workerBodyCost = _(workerBody).sum(i => BODYPART_COST[i]);

function spawnCreeps(state: GlobalState, structureState: StructureState<Spawn>) {
  state = state;

  const spawn = structureState.subject();

  const creepCount = state.creeps().value().length;
  switch (creepCount) {
    case 0:
      if (spawn.room.energyAvailable < 200) {
        return;
      }
      api(structureState).createCreep([CARRY, WORK, MOVE]);
      break;

    case 1:
    case 2:
      if (spawn.room.energyAvailable < 300) {
        doQuickTransfers(structureState, {});
        return;
      }
      api(structureState).createCreep([CARRY, WORK, WORK, MOVE]);
      break;

    default:
      // TODO workers: 5 * WORK, 1 * CARRY, 5 * MOVE
      // TODO transporters: 1 * WORK, 2n * CARRY, n+1 MOVE
      if (spawn.room.energyAvailable < spawn.room.energyCapacityAvailable) {
        doQuickTransfers(structureState, {});
        return;
      }
      const majorSize = Math.floor(spawn.room.energyCapacityAvailable / workerBodyCost);
      let remaining = spawn.room.energyCapacityAvailable % workerBodyCost;
      let cost = majorSize * workerBodyCost;
      const body: string[] = [];
      for (let i = 0; i < majorSize; i++) {
        body.push(...workerBody);
      }
      while (remaining >= carryPartCost) {
        remaining = remaining - carryPartCost;
        cost = cost + carryPartCost;
        body.push(CARRY);
        if (remaining >= carryPartCost) {
          remaining = remaining - carryPartCost;
          cost = cost + carryPartCost;
          body.push(CARRY);
        }
        if (remaining >= movePartCost) {
          remaining = remaining - movePartCost;
          cost = cost + movePartCost;
          body.push(MOVE);
        }
      }

      api(structureState).createCreep(body);
  }
  // log.info("I want to spawn creeps!", spawn);
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
        const mineResult = api(creepState).harvest(sourceState.subject());
        if (mineResult !== 0) {
          log.debug("harvest failed", sourceState, "moveTo=", mineResult, creepState);
        }
        break;

      default:
        // TODO pathing when range > 1
        if (creep.fatigue === 0) {
          if (creep.drop(RESOURCE_ENERGY) === 0) { // DROP ENERGY before moving TODO conditional
            creep.say("💩", false); // poo
          }

          const moveResult = api(creepState).moveTo(pos);
          if (moveResult !== 0) {
            log.debug("move failed", sourceState, "moveTo=", moveResult, creepState);
          }
        } else {
          // log.debug("tired", creepState);
          failed[creepState.getId()] = "fatigue";
        }
    }

    assignCreep(sourceState, site, creep);
    tasked[creep.id] = sourceState.getId();
    // log.debug("tasked", creep.id, "to", sourceState.getId());
    return true;
  } else {
    // TODO release task and send another worker
    log.info("died?", creepState);
    freeSite(sourceState, site);
    failed[creepState.getId()] = sourceState.getId();
    return false;
  }
}

function assignCreep(source: SourceState, site: number, creep: Creep) {
  CreepState.left(creep).memory().working = source.getId();
  if (creep.id === null) {
    throw new Error("bad creep");
  }
  source.memory("workers", true)[ site ] = creep.id;
}

function freeSite(sourceState: SourceState, site: number) {
  const workers: string[] = sourceState.memory("workers", true);
  const id = workers[ site ];
  if (id) {
    delete CreepState.vleft(id).memory().working;
    delete workers[ site ];
  }
}

function freeCreep(creep: CreepState) {
  const oldsite: string[] = SourceState.vleft(creep.memory().working).memory("workers", true);
  delete oldsite[oldsite.indexOf(creep.getId())];
}

function resetAssignments(state: GlobalState, shuffled: boolean) {
  if (shuffled) {
    log.warning("resetting creep assignments");
  } else {
    log.error("recovering from failing activity or foreign branch");
  }
  state.sources().filter(s => delete s.memory().workers).value();
  state.creeps().filter(s => delete s.memory().working).value();
}

function energy(creep: Creep) {
  return F.elvis(creep.carry.energy, 0);
}

function energyFull(percent: number) {
  return (creep: Creep): boolean => energy(creep) > percent * creep.carryCapacity;
}

function energyEmpty(abs: number) {
  return (creep: Creep): boolean => energy(creep) < abs;
}

type ScoreFunc<T> = (value: T) => Scored<T>;
type Scored<T> = { value: T, score: number };

// state/tenergy
const scoreTEnergy = byScore<SourceState>("score");

// creep/venergy + rangeScore
function distanceEnergyFitness(pos: RoomPosition): ScoreFunc<CreepState> {
  return byScore<CreepState>("venergy", (score, s) => {
    // do not give venergy: 0 creeps any distance score
    if (score === 0) {
      return 0;
    }
    return score + DISTANCE_WEIGHT / F.rangeScore(s.pos(), pos);
  });
}

// function tapLog<T>(message: string): (s: T) => T {
//   return s => {
//     log.info(message, s);
//     return s;
//   };
// }

const isTrue: MemoIterator<any, number> = (prev, curr) => {
  return curr ? (prev + 1) : prev;
};

// TODO - you don't need _.chain, lodash says that flow/flowRight avoids intermediates / "shortcut fusion" even with FP
const compactSize = _.curryRight(_.foldl, 3)(0)(isTrue) as (x: any[]) => number;
