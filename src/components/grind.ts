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

const cachedIdleActions: { [id: string]: FindCallback<any> } = {};

const REL = {
  CREEPS_MINING: "workers",
  SOURCE_MINED: "working",
  CREEPS_HAULING: "haulers",
  SOURCE_HAULED: "working",
  STRUCT_DELIVER: "carrying",
};

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

    let idleSources = doHarvest(state, creeps, tasked);

    // score room's current energy velocity based on allocated workers / score of idle sources

    // TODO need better scoring for sources as it relates to goals
    idleSources = _.chain(idleSources).filter(function(s) {
      // sources which have all sites full aren't actually idle
      const sites = s.value.nodeDirs();
      const workers = s.value.memory(REL.CREEPS_MINING, true);
      for (let i = sites.length - 1; i >= 0; i--) {
        if (!workers[sites[i]]) { // null or undef
          return true;
        }
      }
      return false;
    }).value();

    // TODO also prune non-zero risk sources from idle count (GENOME!)

    const idleHaulSites = doHaulEnergy(state, creeps, tasked);

    if (idleHaulSites.length > 0) {
      log.info("idle sites", idleHaulSites.length);
    }

    let idleSites = doBuildStuff(state, creeps, tasked).length;

    idleSites += doRepairStuff(state, creeps, tasked).length;

    if (creeps.length > 0 && commands.hardidle) {
      doIdle(state, opts, creeps, tasked);
    }

    doSpawn(state, idleSources, opts);
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
        if (otherState.memory()[REL.SOURCE_MINED] !== undefined) {
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
      const mem = value.getScore();
      const score = scorer(mem);
      // log.info("byScore result", score);
      return {value, score};
    };
  }

  /* TODO functional? more expressive, why not just use comments? :P
   _.flow(
   (s: T) => s.getScore(),
   scoreManager.byScore(score)
   ) as (s: T) => number;
   */
  return function(value: T) {
    // log.info("byScore input", s);
    const mem = value.getScore();
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
    creep.touchedStorage().map(function(c) {
      if (!isReal(ignore[c.getId()])) {
        return;
      }
      debugger; // TODO REMOVE quick transfers from storage
      if (c.resolve(globalLifecycle)) {
        api(creep).withdraw(c.subject(), RESOURCE_ENERGY);
        doQuickTransfers(c, ignore);
      } else {
        debugger;
        log.error("structure destroyed", c.getId());
      }
    }).value();
    state.touchedCreepIds().reject(F.onKeys(ignore)).map(CreepState.vright).map(function(c) {
      if (c.resolve(globalLifecycle)) {
        api(c).transfer(state.subject(), RESOURCE_ENERGY);
        // scoreManager.rescore(c, c.getScore(), "tenergy", Game.time, 1000);
        // TODO don't ignore unless full?
        ignore[c.getId()] = true;
        doQuickTransfers(c, ignore);
      } else {
        debugger;
        log.error("creep died", c.getId());
      }
    }).value();
  } else {
    // structures have to find creep neighbors
    state.touchedCreepIds().reject(F.onKeys(ignore)).map(CreepState.vright).map(function(c) {
      if (c.resolve(globalLifecycle)) {
        api(c).transfer(state.subject(), RESOURCE_ENERGY);
        // scoreManager.rescore(c, c.getScore(), "tenergy", Game.time, 1000);
        // TODO don't ignore unless full?
        ignore[c.getId()] = true;
        doQuickTransfers(c, ignore);
      } else {
        debugger;
        log.error("creep died", c.getId());
      }
    }).value();
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
          if (otherState.memory()[REL.SOURCE_MINED] !== undefined) {
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
                      tasked: { [creepIdToSourceId: string]: string }): Scored<SourceState>[] {
  state = state;
  tasked = tasked;

  if (compactSize(creeps) === 0) {
    return [];
  }

  // TODO COOL STUFF - nagel's algorithm for hauler assignment! (or just calculate delta venergy)

  // find sources with miners who have low tenergy score, move to them and haul energy back to spawn
  return state.sources().reject(hasBucketBrigade).map(workerVenergyFitness).sortBy("score").map(function(scoredSource): Scored<SourceState>|null {

    const source = scoredSource.value;
    const workers = source.memory(REL.CREEPS_HAULING); // map worker -> destination struct
    for (const worker in workers) {
      // values are string id for StructureState
      if (worker) {
        const creep = CreepState.vright(worker);
        const dst = workers[worker];
        const dstPos = dst === undefined ? undefined : StructureState.vright(dst).pos();
        if (tryHaul(creep, source, dstPos)) {
          creeps[creeps.indexOf(creep.subject())] = null;
        } else {
          delete workers[worker];
        }
      }
    }

    // TODO later roads!
    const assigned = _.chain(creeps).compact().map(CreepState.right).map(haulerTenergyFitness)
      .filter((s: Scored<CreepState>) => s.score > 0).sortBy("score")
      .any(function(scoredCreep: Scored<CreepState>): boolean {
      const creep = scoredCreep.value;

      const structState = findEnergyStorage(state, source);

      source.memory(REL.CREEPS_HAULING)[creep.getId()] = structState.getId();

      return tryHaul(creep, source, structState.pos());
    }).value();

    return assigned ? null : scoredSource;
  }).compact().value() as Scored<SourceState>[];
}

function findEnergyStorage(state: GlobalState, source: SourceState): StructureState<any> {
  source = source; // TODO fitness etc
  return state.spawns().first().valueOf() as StructureState<any>;
}

function hasBucketBrigade(source: SourceState): boolean {
  const workers = source.memory(REL.CREEPS_MINING, true);
  return _.chain(workers).compact().map(CreepState.vright).any(function(creep: CreepState) {
    const brigade = !!(creep.touchedStorage().first().valueOf());
    return brigade;
    // return !(getRawScore(creep, "tenergy") > 999); // TODO NOW too many creeps scored highly
  }).value();
}

function workerVenergyFitness(source: SourceState): Scored<SourceState> {
  const workers = source.memory(REL.CREEPS_MINING, true);
  const score = _.chain(workers).compact().map(CreepState.vright).sum(function(creep: CreepState) {
    return getScore(creep, "venergy");
  }).value(); // TODO assuming workers are 100% effective, this will change in fluxing sources

  const value = source;
  return {value, score};
}

function haulerTenergyFitness(creep: CreepState): Scored<CreepState> {
  const value = creep;
  const score = getScore(creep, "tenergy");
  return {value, score};
}

function doHarvest(state: GlobalState,
                   creeps: (Creep|null)[],
                   tasked: { [creepIdToSourceId: string]: string }): Scored<SourceState>[] {

  if (compactSize(creeps) === 0) {
    return [];
  }

  // garbage collect any workers assigned to negative score sources!
  state.sources().map(byTotalScore).filter(it => it.score <= 0).map(function(scoredSource) {
    const source: SourceState = scoredSource.value;
    const workers = source.memory(REL.CREEPS_MINING, true);
    for (let site = workers.length - 1; site >= 0; site--) {
      const worker = workers[site];
      if (worker) {
        debugger;
        freeSite(source, site);
        delete workers[site];
      }
    }
  }).value();

  return state.sources().map(byTotalScore).filter(it => it.score > 0).sortBy("score").reverse()
    // TODO - CRITICAL - memoize statement thus far until closer source or destination is discovered
    // this is called an election!
    .map(function(scoredSource) {
      const source: SourceState = scoredSource.value;
      scoredSource.score = getScore(source, "maxvenergy");
      let failed: any = {};

      const dirToPosition = F.dirToPositionCall(source.pos());
      const scoreEnergy = distanceEnergyFitness(source.pos());

      const workers = source.memory(REL.CREEPS_MINING, true);
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
            scoredSource.score = scoredSource.score - getScore(creep, "venergy"); // deduct creep's mining capability from the energy score
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
        const working = cs.memory()[REL.SOURCE_MINED];
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
          debugger;
          throw new Error("oops! no worker found");
        }

        creep.lock();
        if (creep.memory()[REL.SOURCE_MINED] !== undefined) {
          debugger;
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
        scoredSource.score = scoredSource.score - getScore(creep, "venergy");

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
    log.info("rescoring game state");
    scoreManager.rescore(state, state.getScore(), undefined, Game.time);
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
export function doSpawn(state: GlobalState, idleSources: Scored<SourceState>[], commands: Options) {
  commands = commands;

  return state.spawns().any(function(structureState) {
    spawnCreeps(state, structureState, idleSources);
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

function spawnCreeps(state: GlobalState, structureState: StructureState<Spawn>, idleSources: Scored<SourceState>[]) {
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

      if (idleSources.length > 0) {
        // spawn miners
        const targetSource = idleSources[0].value; // TODO sort.first!
        let venergy = getScore(targetSource, "maxvenergy");
        let budget = spawn.room.energyCapacityAvailable - movePartCost - carryPartCost;
        const body: string[] = [CARRY, MOVE];
        // TODO budget >= 0 assertion!
        while (venergy > 0 && budget >= workPartCost) {
          body.push(WORK);
          budget -= workPartCost;
          venergy -= ENERGY_WORK_WEIGHT;
        }
        api(structureState).createCreep(body);
      } else {
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
      } // TODO SOON builder body!
  }
}

function tryHaul(creepState: CreepState, sourceState: SourceState,
                 deliveryPos: RoomPosition|undefined): boolean {
  if (creepState.resolve(globalLifecycle)) {
    const creep = creepState.subject();
    if (_.chain(creep.carry).values().sum().value() >= creep.carryCapacity) {
      if (deliveryPos === undefined) {
        const spawn  = _.chain(creep.room.find(FIND_MY_SPAWNS)).first() as Spawn;
        sourceState.memory(REL.CREEPS_HAULING)[creepState.getId()] = spawn.id;
        creep.moveTo(spawn.pos);
      } else {
        creep.moveTo(deliveryPos);
      }
    } else {
      // TODO pickup dropped energy?
      doQuickTransfers(creepState, {});

      // TODO determine pickup location(s)
      if (creep.moveTo(sourceState.pos()) !== 0) {
        creep.move(1 + Math.floor(Math.random() * 8));
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
  CreepState.left(creep).memory()[REL.SOURCE_MINED] = source.getId();
  if (creep.id === null) {
    throw new Error("bad creep");
  }
  source.memory(REL.CREEPS_MINING, true)[ site ] = creep.id;
}

function freeSite(sourceState: SourceState, site: number) {
  const workers: string[] = sourceState.memory(REL.CREEPS_MINING, true);
  const id = workers[ site ];
  if (id) {
    delete CreepState.vleft(id).memory()[REL.SOURCE_MINED];
    delete workers[ site ];
  }
}

function freeCreep(creep: CreepState) {
  const oldsite: string[] = SourceState.vleft(creep.memory()[REL.SOURCE_MINED]).memory(REL.CREEPS_MINING, true);
  delete oldsite[oldsite.indexOf(creep.getId())];
}

function resetAssignments(state: GlobalState, shuffled: boolean) {
  if (shuffled) {
    log.warning("resetting creep assignments");
  } else {
    log.error("recovering from failing activity or foreign branch");
  }
  state.sources().filter(s => delete s.memory()[REL.CREEPS_MINING]).value();
  state.creeps().filter(s => delete s.memory()[REL.SOURCE_MINED]).value();
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
  return byScore<CreepState>("venergy", function(score, s) {
    // do not give venergy: 0 creeps any distance score
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

// function getRawScore(state: State<any>, metric: string): number|undefined {
//   const mem = state.getScore();
//   return scoreManager.getScore(mem, metric, undefined);
// }

function getScore(state: State<any>, metric: string): number {
  const mem = state.getScore();
  let calculated = scoreManager.getScore(mem, metric, undefined);
  if (calculated === undefined) {
    calculated = scoreManager.rescore(state, mem, metric, Game.time);
    if (calculated === undefined) {
      debugger; // can't score
      throw new Error("can't score " + metric);
    }
  }
  return calculated;
}
