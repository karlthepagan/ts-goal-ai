import * as F from "./functions";
import GlobalState from "./state/globalState";
import {log} from "./support/log";
import CreepState from "./state/creepState";
import SourceState from "./state/sourceState";
import {throttle} from "./util/throttle";
import {scoreManager} from "./metrics/scoreSingleton";
import {SCORE_KEY} from "./metrics/scoreManager";

export function grind(state: GlobalState) {
  const commands = state.memory() as Commands;
  const opts = state.memory("config") as Options;

  if (commands.shuffle) {
    delete commands.shuffle;
    resetAssignments(state);
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

  doSpawn(state, opts);

  const creeps = _.values<Creep|null>(Game.creeps);
  // tasked is useful for double-checking my accounting
  const tasked: { [creepIdToSourceId: string]: string } = {};

  doHarvest(state, creeps, tasked);

  doIdle(state, opts, creeps, tasked);
}

function doIdle(state: GlobalState, opts: Options, creeps: (Creep|null)[], tasked: any) {
  state = state;
  opts = opts;
  tasked = tasked;

  _.chain(creeps).compact().map((creep: Creep) => {
    creep.say("?", false);
  }).value();
}

function filterLte<T>(value: number, score: (object: T) => number) {
  return _.flow(score, _.curry(_.lte, value)) as (o: T) => boolean;
}

function doHarvest(state: GlobalState,
                   creeps: (Creep|null)[],
                   tasked: { [creepIdToSourceId: string]: string }): (SourceState|null)[] {

  const tenergyScore = scoreManager.byScore("tenergy");

  // TODO compact<SourceState> should remove null|undefined
  return state.sources().reject(filterLte(0, tenergyScore)).sortBy(tenergyScore).map((source: SourceState) => {
    let failed: any = {};
    const sites = source.nodeDirs();

    const workers = source.memory("workers");

    const dirToPosition = F.dirToPosition(source.pos());

    if (!source.resolve()) {
      log.error("failed to resolve", source);
      return source;
    }

    for (const site of sites) {

      const pos = dirToPosition(site);
      const byRangeToSite = F.byStateRangeTo(pos);
      const worker = workers[site + ""];
      if (worker !== undefined) {
        // log.debug("resolving worker @", site, worker.id);
        // grab worker and mine!
        if (tryHarvest(CreepState.vright(worker.id), source, pos, site, tasked, failed)) {
          // log.debug("mined", site, "next site for", source);
          continue;
        }
      }

      log.info("allocating", source, "site", site);

      let harvested = false;
      do {
        // allocate worker, find closest, TODO prefer role=sourcer
        // find only in same room for now

        // TODO switch to list of untasked creeps which we null out assigned
        log.debug(_.chain(creeps).compact().size().valueOf(), "left");
        let creep = _.chain(creeps).compact().map(CreepState.right).filter((cs: CreepState) => {
          const creep = cs.subject();
          if (tasked[creep.id] !== source.getId()) {
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
        }).sortBy(byRangeToSite).first().valueOf() as CreepState;

        if (creep === null || creep === undefined) {
          log.error("no worker found");
          return source;
        }

        creep.lock();
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
          log.debug("tired", creepState);
          failed[creepState.getId()] = "fatigue";
        }
    }

    const worker = F.expand( [ site + "" ], sourceState.memory("workers") );
    worker.id = creep.id;
    tasked[creep.id] = sourceState.getId();
    return true;
  } else {
    log.error("died?", creepState);
    F.deleteExpand( [ site + ""], sourceState.memory("workers") );
    failed[creepState.getId()] = sourceState.getId();
    return false;
  }
}

function resetAssignments(state: GlobalState) {
  state.sources().filter((s) => delete s.memory().workers).value();
  state.creeps().filter((s) => delete s.memory().working).value();
}
