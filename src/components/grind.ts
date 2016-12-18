import * as F from "./functions";
import GlobalState from "./state/globalState";
import {log} from "./support/log";
import CreepState from "./state/creepState";
import SourceState from "./state/sourceState";
import {throttle} from "./util/throttle";
import {scoreManager} from "./score/scoreSingleton";
import State from "./state/abstractState";
import {DISTANCE_WEIGHT, ENERGY_WORK_WEIGHT} from "./impl/stateScoreProvider";
import MemoIterator = _.MemoIterator;
import LookForIterator from "./util/lookForIterator";
import {FindCallback} from "./util/lookForIterator";
import api from "./event/behaviorContext";
import {isReal} from "./functions";
import StructureState from "./state/structureState";
import {globalLifecycle} from "./event/behaviorContext";
import ListIterator = _.ListIterator;
import maps from "./map/mapsSingleton";

const cachedIdleActions: { [id: string]: FindCallback<any> } = {};

export function grind(state: GlobalState) {
  const commands = state.memory() as Commands;
  const opts = state.memory("config") as Options;

  if (commands.debug) {
    debugger; // break command
    delete commands.debug;
  }

  if (commands.shuffle || commands.last === undefined
      || (Game.time - commands.last) > F.elvis(opts.failedTicksToShuffle, 5)) { // TODO integrate into event manager
    resetAssignments(state, commands.shuffle);
    delete commands.shuffle;
  }

  const th = throttle();

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

    if (creeps.length > 0 && commands.hardxfer) {
      doTransfers(state, creeps, tasked);
    }

    let idleSources = doHarvest(state, creeps, tasked, commands);

    // score room's current energy velocity based on allocated workers / score of idle sources

    // TODO need better scoring for sources as it relates to goals
    // TODO NOW venergy per source
    idleSources = _.chain(idleSources).filter(function(s) {
      // sources which have all sites full aren't actually idle
      const sites = s.value.nodeDirs();
      const workers = s.value.getWorkers();
      for (let i = sites.length - 1; i >= 0; i--) {
        if (!workers[sites[i]]) { // null or undef
          return true;
        }
      }
      return false;
    }).value();

    // TODO also prune non-zero risk sources from idle count (GENOME!)

    // TODO NOW tenergy per source
    const idleHaulSites = doHaulEnergy(state, creeps, tasked, commands);

    if (idleHaulSites.length > 0) {
      log.info("idle sites", idleHaulSites.length);
    }

    // TODO venergy per site
    let idleSites = doBuildStuff(state, creeps, tasked).length;

    idleSites += doRepairStuff(state, creeps, tasked).length;

    if (creeps.length > 0 && commands.hardidle) {
      doIdle(state, opts, creeps, tasked);
    }

    if (!commands.disableSpawn) {
      doSpawn(state, idleSources, idleHaulSites, idleSites, commands);
    }
  }

  commands.last = Game.time;
}

export function doIdle(state: GlobalState, opts: Options, creeps: (Creep|null)[], tasked: any) {
  state = state;
  opts = opts;
  tasked = tasked;

  _.chain(creeps).compact().map(function(creep: Creep) {
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
  }).value();

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
  _.chain(creeps).compact().filter(energyFull(0.8)).sortBy(energy).map(function(creep: Creep) {

    LookForIterator.search<Creep>(creep.pos, 3, creep, [{
      key: LOOK_CREEPS,
      value: function(other: Creep, range: number, self: Creep) {
        if (range < 0) {
          return true;
        }
        let result = 0;
        const otherState = CreepState.left(other);
        if (!otherState.getSourceMined()) {
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
      value: function(resource: Resource, range: number, self: Creep) {
        range = range;
        if (self.pickup(resource) === 0) {
          self.say("🔆", false);
          return false;
        }
        return true;
      },
    }], function(found: any, callback: FindCallback<Creep>) {

      callback.target = found.id as string;
      cachedIdleActions[creep.id] = callback as FindCallback<any>;
      creeps[creeps.indexOf(creep)] = null;
      return false;
    });

    return creep;
  }).value();

  // spend energy
  _.chain(creeps).compact().filter(energyEmpty(10)).sortBy(energy).reverse().map(function(creep: Creep) {

    LookForIterator.search<Creep>(creep.pos, 3, creep, [{
      key: LOOK_CONSTRUCTION_SITES,
      value: function(site: ConstructionSite) {
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
      value: function(structure: OwnedStructure) {
        if (structure.hits < structure.hitsMax) {
          creep.repair(structure);
          creep.say("🔨", false);
          return false;
        }
        return true;
      },
    }], function(found: any, callback: FindCallback<Creep>) {

      callback.target = found;
      cachedIdleActions[creep.id] = callback as FindCallback<any>;
      creeps[creeps.indexOf(creep)] = null;
      return false;
    });

    return creep;
  }).value();

  _.chain(creeps).compact().map(function(creep: Creep) {
    // dunno
    creep.say("?", false);
  }).value();
}

/**
 * transform State -> memory -> extract score -> decorate score using State
 */
function byScore<T extends State<any>>(metric?: string, decorator?: MemoIterator<any, number> ): ScoreFunc<T> {

  const scorer = metric === undefined ? scoreManager.byScore() : scoreManager.byScore(metric);

  // DRY is a nontrivial cost
  if (decorator === undefined) {
    return function(value: T) {
      // log.info("byScore input", s);
      const mem = value.getScoreMemory();
      const score = scorer(mem);
      // log.info("byScore result", score);
      return {value, score};
    };
  }

  /* TODO functional? more expressive, why not just use comments? :P
   _.flow(
   (s: T) => s.getScoreMemory(),
   scoreManager.byScore(score)
   ) as (s: T) => number;
   */
  return function(value: T) {
    // log.info("byScore input", s);
    const mem = value.getScoreMemory();
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
export function doQuickTransfers(state: State<any>, ignore: any, filter: ListIterator<State<any>, boolean>): boolean {
  ignore[state.getId()] = true;
  let transferred = false;
  if (state.isEnergyMover()) {
    const creep = state as CreepState;
    // creeps can pickup
    creep.touchedDrops(RESOURCE_ENERGY).reject(F.onKeys(ignore)).map(function(d) {
      if (api(creep).pickup(d) !== 0) {
        log.debug("failed to pickup (this is fine)");
      } else {
        api(creep).say("🔆", false);
        transferred = true;
      }
    }).value();
    // creeps can withdraw
    creep.touchedStorage().filter(filter).map(function(c) {
      if (isReal(ignore[c.getId()])) {
        // reject if in ignore list
        return;
      }
      if (c.resolve(globalLifecycle)) {
        if (api(creep).withdraw(c.subject(), RESOURCE_ENERGY) !== 0) {
          debugger; // failed to withdraw
        } else {
          debugger; // TODO observe
          api(creep).say("💱", false);
          transferred = true;
        }
        doQuickTransfers(c, ignore, filter);
      } else {
        debugger; // structure destroyed
        log.error("structure destroyed", c.getId());
      }
    }).value();
    creep.touchedCreepIds().reject(F.onKeys(ignore)).map(CreepState.vright).filter(filter).map(function(c) {
      if (c.resolve(globalLifecycle)) {
        if (api(c).transfer(state.subject(), RESOURCE_ENERGY) !== 0) {
          log.debug("attempted empty transfer from ", c);
        } else {
          api(c).say("👋", false);
          c.copyScore("denergy", "venergy");
          transferred = true;
        }
        // scoreManager.rescore(c, c.getScoreMemory(), "tenergy", Game.time, 1000);
        // TODO don't ignore unless full?
        doQuickTransfers(c, ignore, filter);
      } else {
        debugger; // creep died
        log.error("creep died", c.getId());
      }
    }).value();
  } else {
    // structures have to find creep neighbors
    state.touchedCreepIds().reject(F.onKeys(ignore)).map(CreepState.vright).filter(filter).map(function(c) {
      if (c.resolve(globalLifecycle)) {
        if (api(c).transfer(state.subject(), RESOURCE_ENERGY) !== 0) {
          log.debug("attempted empty transfer from ", c);
        } else {
          api(c).say("👋", false);
          c.copyScore("denergy", "venergy");
          transferred = true;
        }
        // scoreManager.rescore(c, c.getScoreMemory(), "tenergy", Game.time, 1000);
        // TODO don't ignore unless full?
        doQuickTransfers(c, ignore, filter);
      } else {
        debugger; // creep died
        log.error("creep died", c.getId());
      }
    }).value();
  }

  return transferred;
}

// TODO planned transfers, calculate venergy of all participants and move to meet deadline

export function doTransfers(state: GlobalState,
                            creeps: (Creep|null)[],
                            tasked: { [creepIdToSourceId: string]: string }): (StructureState<any>|null)[] {
  if (compactSize(creeps) === 0) {
    return [];
  }
  tasked = tasked;

  return state.spawns().map(function(structureState) {
    const spawn = structureState.subject();
    if (spawn.energy < spawn.energyCapacity) {
      // energy hungry, feed me!
      LookForIterator.search<OwnedStructure>(spawn.pos, 3, spawn, [{
        key: LOOK_CREEPS,
        value: function(other: Creep, range: number, self: OwnedStructure) {
          if (range < 0) {
            return true;
          }
          let result = 0;
          const otherState = CreepState.left(other);
          if (!otherState.getSourceMined()) {
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

function doRepairStuff(state: GlobalState,
                       creeps: (Creep|null)[],
                       tasked: { [creepIdToSourceId: string]: string }): Scored<SourceState>[] {
  state = state;
  tasked = tasked;

  if (compactSize(creeps) === 0) {
    return [];
  }

  // TODO find buildings at less than 100% hits
  // need to filter / genome? figure out how to build up walls

  return [];
}

function doBuildStuff(state: GlobalState,
                      creeps: (Creep|null)[],
                      tasked: { [creepIdToSourceId: string]: string }): Scored<SourceState>[] {
  state = state;
  tasked = tasked;

  if (compactSize(creeps) === 0) {
    return [];
  }

  // TODO find construction sties and calculate energy needed to build them

  return [];
}

function doHaulEnergy(state: GlobalState,
                      creeps: (Creep|null)[],
                      tasked: { [creepIdToSourceId: string]: string },
                      commands: Commands): Scored<SourceState>[] {
  state = state;
  tasked = tasked;

  // TODO COOL STUFF - nagel's algorithm for hauler assignment! (or just calculate delta venergy)

  // find sources with miners who have low tenergy score, move to them and haul energy back to spawn
  return state.sources().reject(hasBucketBrigade).map(workerVenergyFitness).filter(s => s.score >= 0) .sortBy("score").reverse().map(function(scoredSource): Scored<SourceState>|null {

    let assigned = false;
    const source = scoredSource.value;
    const workers = source.getHaulers();
    for (const worker in workers) {
      // values are string id for StructureState
      if (worker) {
        const creep = CreepState.vright(worker);
        const dst = workers[worker];
        const dstPos = dst === undefined ? undefined : StructureState.vright(dst).pos();
        if (tryHaul(state, creep, source, dstPos, commands)) {
          creeps[creeps.indexOf(creep.subject())] = null;
          assigned = true;
        } else {
          delete workers[worker];
        }
      }
    }

    if (!assigned) {
      if (commands.debugHaul) {
        debugger; // Commands.debugHaul
      }

      // TODO later roads!
      assigned = _.chain(creeps).compact().map(CreepState.right).map(haulerTenergyFitness)
        .filter((s: Scored<CreepState>) => s.score >= 0).sortBy("score")
        .any(function (scoredCreep: Scored<CreepState>): boolean {

          const creep = scoredCreep.value;

          const structState = findEnergyStorage(state, source);

          source.getHaulers()[creep.getId()] = structState.getId();

          if (tryHaul(state, creep, source, structState.pos(), commands)) {
            creeps[creeps.indexOf(creep.subject())] = null;
            return true;
          }
          return false;
        }).value();
    }

    return assigned ? null : scoredSource;
  }).compact().value() as Scored<SourceState>[];
}

function findEnergyStorage(state: GlobalState, source: SourceState): StructureState<any> {
  state = state;
  source = source;
  // return state.spawns().first().valueOf() as StructureState<any>;
  source.resolve(globalLifecycle);
  return StructureState.right(source.subject().room.controller as Controller);
  // return StructureState.vright("58452da8bdb6c32111c6ba88");
}

function hasBucketBrigade(source: SourceState): boolean {
  const workers = source.getWorkers();
  return _.chain(workers).compact().map(CreepState.vright).any(function(creep: CreepState) {
    const brigade = !!(creep.touchedStorage().first().valueOf());
    return brigade;
  }).value();
}

function workerVenergyFitness(source: SourceState): Scored<SourceState> {
  const workers = source.getWorkers();
  let score = _.chain(workers).compact().map(CreepState.vright).sum(function(creep: CreepState) {
    return creep.getScore("maxvenergy");
  }).value(); // TODO assuming workers are 100% effective, this will change in fluxing sources

  score = score + source.getScore("risk");

  const value = source;
  return {value, score};
}

function haulerTenergyFitness(creep: CreepState): Scored<CreepState> {
  const value = creep;
  const score = creep.getScore("tenergy");
  return {value, score};
}

function doHarvest(state: GlobalState,
                   creeps: (Creep|null)[],
                   tasked: { [creepIdToSourceId: string]: string },
                   commands: Commands): Scored<SourceState>[] {

  if (compactSize(creeps) === 0) {
    return [];
  }

  // garbage collect any workers assigned to negative score sources!
  state.sources().map(byTotalScore).filter(it => it.score <= 0).map(function(scoredSource) {
    const source: SourceState = scoredSource.value;
    const workers = source.getWorkers();
    for (let site = workers.length - 1; site >= 0; site--) {
      const worker = workers[site];
      if (worker) {
        debugger; // garbage collect a worker
        freeSite(source, site);
        delete workers[site];
      }
    }
  }).value();

  return state.sources().map(byTotalScore).filter(it => it.score >= 0).sortBy("score").reverse()
    // TODO - CRITICAL - memoize statement thus far until closer source or destination is discovered
    // this is called an election!
    .map(function(scoredSource) {
      const source: SourceState = scoredSource.value;
      scoredSource.score = source.getScore("maxvenergy");
      let failed: any = {};

      const dirToPosition = F.dirToPositionCall(source.pos());
      const scoreEnergy = distanceEnergyFitness(source.pos());

      const workers = source.getWorkers();
      for (let site = workers.length - 1; site >= 0; site--) {
        const worker = workers[site];
        if (worker) {
          const pos = dirToPosition(site);

          // TODO differentiate between successful mining and allocation swap (long term optimization)
          // grab worker and mine!
          const creep = CreepState.vright(worker);
          if (tryHarvest(creep, source, pos, site, tasked, failed)) {
            // log.debug("mined", site, "next site for", source);
            creeps[creeps.indexOf(creep.subject())] = null;
            scoredSource.score = scoredSource.score - creep.getScore("maxvenergy"); // deduct creep's mining capability from the energy score
          } else {
            // TODO clean up assignment codes
            delete workers[site];
          }
        }
      }

      if (scoredSource.score <= 0) {
        // TODO temporary mining goal
        return null;
      }

      // log.debug(F.str(creeps, compactSize), "left"); // number before candidate processing

      let candidates = _.chain(creeps).compact().filter(function(creep: Creep) {
        const taskId = tasked[creep.id];
        if (taskId !== undefined && taskId !== source.getId()) {
          log.warning("already tasked", creep);
          return false;
        }
        if (failed[creep.id] !== undefined) {
          log.info("failed:", failed[creep.id], creep.name);
          return false;
        }
        if (!_(creep.body).some((b: any) => b.type === WORK)) {
          return false;
        }
        return true;
      }).map(CreepState.build).filter(function(cs: CreepState) {
        const working = cs.getSourceMined();
        if (working !== undefined && working !== source.getId()) {
          // log.debug("already working", creep.name);
          return false;
        }
        return true;
      }).map(scoreEnergy).sortBy("score").reverse().value();
      // highest score by fitness (body + distance)

      if (candidates === undefined || candidates.length === 0) {
        // no creeps to harvest this source!
        return scoredSource;
      }

      if (commands.debugHarvest) {
        debugger; // debugHarvest
      }

      log.debug(candidates.length, "left");

      let sites = source.nodeDirs();

      // only consider the best candidates!
      candidates = candidates.slice(0, sites.length);

      // TODO NOW score all sites based on distance from creep and mine them in that order
      const byRangeToSource = F.byStateRangeTo(source.pos());

      const assignedWorkers = _.chain(candidates).map(it => it.value).sortBy(byRangeToSource).value();

      _.chain(assignedWorkers).map(function(creep) {
        if (scoredSource.score <= 0) {
          // TODO temporary mining goal
          return false;
        }

        const scoredSite = _.chain(sites).reject(s => workers[s]) // TODO later shuffle workers?
          .map(siteDistanceFitness(source.pos(), creep.pos())).sortBy(s => s.score).value()[0];

        if (scoredSite === undefined) {
          // slots full!
          return false;
        }

        const site = scoredSite.value;

        const pos = dirToPosition(site);

        if (creep === null || creep === undefined) {
          debugger; // no worker found
          throw new Error("oops! no worker found");
        }

        creep.lock();
        if (creep.getSourceMined() !== undefined) {
          debugger; // creep assigned to mine
          // was assigned!
          // free current source
          freeCreep(creep);
        }

        let harvested = tryHarvest(creep, source, pos, site, tasked, failed);
        creep.release();

        if (!harvested) {
          return false;
        }

        creeps[creeps.indexOf(creep.subject())] = null;
        // MUTATING!
        scoredSource.score = scoredSource.score - creep.getScore("maxvenergy");

        return true;
      }).value();

      return scoredSource.score > 0 ? scoredSource : null;
    }
  ).compact().value() as Scored<SourceState>[];
  // TODO compact<SourceState> should remove null|undefined in the parameterized type
}

function doScans(state: GlobalState, roomScan: boolean, rescore: boolean, remoteRoomScan: boolean, commands: Commands) {
  if (roomScan) {
    // scan real rooms
    state.rooms().map(function(room) {
      // room.subject().find(FIND_HOSTILE_CREEPS)
      log.debug("TODO scan for new buildings and enemies", room);
      // TODO identify new buildings, new enemies
    }).value();
  }

  if (rescore) {
    if (commands.debugScore) {
      debugger; // command.debugScore
    }
    log.debug("rescoring game state");
    scoreManager.rescore(state, state.getScoreMemory(), undefined, Game.time);
  }

  if (remoteRoomScan) {
    let count = 0;
    state.remoteRooms().map(function(room) {
      if (!room.resolve(globalLifecycle)) {
        count++;
      }
    }).value();
    if (count > 0) {
      log.debug("rooms without vision:", count);
    }
  }
}

/**
 *
 * @param idleSources un-exhausted sources paired with their current venergy deficit
 */
export function doSpawn(state: GlobalState, idleSources: Scored<SourceState>[],
                        idleHaulSites: Scored<SourceState>[],
                        idleSites: number,
                        commands: Commands) {
  return state.spawns().any(function(structureState: StructureState<Spawn>) {
    spawnCreeps(state, structureState, idleSources, idleHaulSites, idleSites, commands);
    return true;
  }).value();
}

const movePartCost = BODYPART_COST.move;
const carryPartCost = BODYPART_COST.carry;
const workPartCost = BODYPART_COST.work;
// const workerBody = [CARRY, WORK, MOVE, MOVE];
// const workerBodyCost = _(workerBody).sum(i => BODYPART_COST[i]);
const haulerBody = [CARRY, MOVE];
const haulerBodyCost = _(haulerBody).sum(i => BODYPART_COST[i]);

function spawnCreeps(state: GlobalState, structureState: StructureState<Spawn>,
                     idleSources: Scored<SourceState>[],
                     idleHaulSites: Scored<SourceState>[],
                     idleSites: number,
                     commands: Commands) {
  const spawn = structureState.subject();

  const creepCount = state.creeps().value().length;
  switch (creepCount) {
    case 0:
      if (spawn.room.energyAvailable < 200) {
        structureState.setScore("venergy", -22); // TODO fix goal and set real venergy
        return;
      }
      api(structureState).createCreep([CARRY, WORK, MOVE]);
      break;

    case 1:
    case 2:
      if (spawn.room.energyAvailable < 300) {
        if (commands.debugTransfers) {
          debugger;
        }
        structureState.setScore("venergy", -25); // TODO fix goal and set real venergy
        doQuickTransfers(structureState, {}, F.True);
        return;
      }
      api(structureState).createCreep([CARRY, WORK, WORK, MOVE]);
      break;

    default:
      // TODO workers: 5 * WORK, 1 * CARRY, 5 * MOVE
      // TODO transporters: 1 * WORK, 2n * CARRY, n+1 MOVE
      if (spawn.room.energyAvailable < spawn.room.energyCapacityAvailable) {
        if (commands.debugTransfers) {
          debugger;
        }
        structureState.setScore("venergy", -25); // TODO fix goal and set real venergy
        doQuickTransfers(structureState, {}, F.True);
        return;
      }

      if (spawn.spawning && spawn.spawning.remainingTime > 0) { // spawn.spawning.remainingTime > 0
        // debugger; // you should have been building extensions a while ago, but let's make a nest now
        return;
      }

      if (idleSources.length > 0) {
        // spawn miners
        const targetSource = idleSources[0].value; // TODO sort.first!
        let venergy = targetSource.getScore("maxvenergy");
        let budget = spawn.room.energyCapacityAvailable - movePartCost - carryPartCost;
        const body: string[] = [CARRY, MOVE];
        // TODO budget >= 0 assertion!
        while (venergy > 0 && budget >= workPartCost) {
          body.push(WORK);
          budget -= workPartCost;
          venergy -= ENERGY_WORK_WEIGHT;
        }
        api(structureState).createCreep(body);
      } else if (idleHaulSites.length > 0) {
        // spawn 20% energy spenders - TODO genome!
        // spawn haulers
        // TODO calculate time to transport under carry capacity
        let budget = spawn.room.energyCapacityAvailable - movePartCost - carryPartCost;
        const body: string[] = [CARRY, MOVE];
        // TODO budget >= 0 assertion!
        while (budget >= haulerBodyCost) {
          Array.prototype.push.apply(body, haulerBody); // body.push(...haulerBody);
          budget -= haulerBodyCost;
        }
        api(structureState).createCreep(body);
      } else if (idleSites > 0) {
        debugger; // TODO spawn builders
        log.debug("i want to spawn builders");
      }
  }
}

function tryHaul(state: GlobalState, creepState: CreepState, sourceState: SourceState,
                 deliveryPos: RoomPosition|undefined, commands: Commands): boolean {
  if (creepState.resolve(globalLifecycle)) {
    const creep = creepState.subject();
    if (_.chain(creep.carry).values().sum().value() >= creep.carryCapacity) {
      if (deliveryPos === undefined) {
        const structState = findEnergyStorage(state, sourceState);
        sourceState.getHaulers()[creepState.getId()] = structState.getId();
        deliveryPos = structState.pos();
      }
      // TODO moveByPath
      let result = 1;
      for (let n = 0; result !== 0 && n < 2; n++) {
        result = api(creepState).moveTo(deliveryPos, {ignoreCreeps: n === 0});
      }
      // TODO NOW give away energy to every building on the way
    } else {
      if (commands.debugTransfers) {
        debugger; // debug transfers
      }
      const transferred = doQuickTransfers(creepState, {}, function(s: State<any>) {
        return !(s.getScore("venergy") < 1);
      });

      // TODO determine pickup location(s)
      if (api(creepState).moveTo(sourceState.pos(), {ignoreCreeps: true}) !== 0 && !transferred) {
        api(creepState).move(1 + Math.floor(Math.random() * 8));
      }
    }

    return true;
  }

  return false;
}

function tryHarvest(creepState: CreepState, sourceState: SourceState,
                    pos: RoomPosition, site: number,
                    tasked: { [creepIdToSourceId: string]: string }, failed: any): boolean {

  if (creepState.resolve(globalLifecycle)) {
    const range = creepState.pos().getRangeTo(pos);
    // log.info("harvesting", creepState, creepState.pos(), "to", sourceState, pos, "range", range);
    const creep = creepState.subject();
    switch (range) {
      case 0:
        if (!sourceState.resolve(globalLifecycle)) {
          log.error("failed to resolve", sourceState);
          return false;
        }
        const mineResult = api(creepState).harvest(sourceState.subject());
        if (mineResult !== 0) {
          log.debug("harvest failed", sourceState, "moveTo=", mineResult, creepState);
        } else {
          creepState.copyScore("venergy", "maxvenergy");
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
  CreepState.left(creep).setSourceMined(source.getId());
  if (creep.id === null) {
    throw new Error("bad creep");
  }
  const sites = source.getWorkers();
  if (!sites[site]) {
    // first allocation!

    // TODO method to cost and transform energy handoff
    const room = source.pos().roomName;
    let heatMap = maps.energySource[room];
    if (!heatMap) {
      maps.energySource[room] = heatMap = maps.init(room);
    }

    const pos = F.dirToPosition(source.pos(), site);
    for (let x = pos.x + 1; x >= pos.x - 1; x--) {
      for (let y = pos.y + 1; y >= pos.y - 1; y--) {
        heatMap.set(x, y, heatMap.get(x, y) - 10);
      }
    }
  }
  sites[site] = creep.id;
}

function freeSite(sourceState: SourceState, site: number) {
  const workers: string[] = sourceState.getWorkers();
  const id = workers[ site ];
  if (id) {
    CreepState.vleft(id).deleteSourceMined();
    delete workers[ site ];

    const heatMap = maps.energySource[sourceState.pos().roomName];
    if (heatMap) {
      const pos = F.dirToPosition(sourceState.pos(), site);
      for (let x = pos.x + 1; x >= pos.x - 1; x--) {
        for (let y = pos.y + 1; y >= pos.y - 1; y--) {
          heatMap.set(x, y, heatMap.get(x, y) + 10);
        }
      }
    } else {
      debugger;
      log.warning("double free?");
    }
  }
}

function freeCreep(creep: CreepState) {
  const oldsite: string[] = SourceState.vleft(creep.getSourceMined()).getWorkers();
  delete oldsite[oldsite.indexOf(creep.getId())];
}

function resetAssignments(state: GlobalState, shuffled: boolean) {
  if (shuffled) {
    log.warning("resetting creep assignments");
  } else {
    log.error("recovering from failing activity or foreign branch");
  }
  state.sources().filter(s => s.clearWorkers()).value();
  state.creeps().filter(s => s.deleteSourceMined()).value();
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

const byTotalScore = byScore<SourceState>();

// creep/venergy + rangeScore
function distanceEnergyFitness(pos: RoomPosition): ScoreFunc<CreepState> {
  return byScore<CreepState>("maxvenergy", function(score, s) {
    // do not give maxvenergy: 0 creeps any distance score
    if (score === 0) {
      return 0;
    }
    return score + DISTANCE_WEIGHT / F.rangeScore(s.pos(), pos);
  });
}

function siteDistanceFitness(origin: RoomPosition, target: RoomPosition): ScoreFunc<number> {
  return function(value: number): Scored<number> {
    const score = F.dirToPosition(origin, value).getRangeTo(target);
    return {value, score};
  };
}

// function tapLog<T>(message: string): (s: T) => T {
//   return s => {
//     log.info(message, s);
//     return s;
//   };
// }

const isTrueAccumulator: MemoIterator<any, number> = (prev, curr) => curr ? (prev + 1) : prev;

// TODO - you don't need _.chain, lodash says that flow/flowRight avoids intermediates / "shortcut fusion" even with FP
const compactSize = _.curryRight(_.foldl, 3)(0)(isTrueAccumulator) as (x: any[]) => number;
