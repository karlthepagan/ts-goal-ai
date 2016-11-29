import * as F from "./functions";
import GlobalState from "./state/globalState";
import {log} from "./support/log";
import CreepState from "./state/creepState";
import SourceState from "./state/sourceState";
import {throttle} from "./util/throttle";
import {scoreManager} from "./score/scoreSingleton";
import {SCORE_KEY} from "./score/scoreManager";

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

  const creeps = _.values<Creep|null>(Game.creeps);
  // tasked is useful for double-checking my accounting
  const tasked: { [creepIdToSourceId: string]: string } = {};

  if (!commands.pause) {
    doSpawn(state, opts);

    doHarvest(state, creeps, tasked);

    doIdle(state, opts, creeps, tasked);
  }
}

function doIdle(state: GlobalState, opts: Options, creeps: (Creep|null)[], tasked: any) {
  state = state;
  opts = opts;
  tasked = tasked;

  _.chain(creeps).compact().map((creep: Creep) => {
    creep.say("?", false);
  }).value();
}

function doHarvest(state: GlobalState,
                   creeps: (Creep|null)[],
                   tasked: { [creepIdToSourceId: string]: string }): (SourceState|null)[] {

  const tenergyScore = _.flow(
    (s: SourceState) => s.memory(SCORE_KEY),
    scoreManager.byScore("tenergy")
  ) as (s: SourceState) => number;

  // TODO compact<SourceState> should remove null|undefined
  return state.sources()
      .groupBy(tenergyScore).pairs().filter((it) => +it[0] > 0).map((it) => it[1]).flatten()
    // TODO - CRITICAL - memoize statement thus far until closer source or destination is discovered
      .map((source: SourceState) => {
    let failed: any = {};
    const sites = source.nodeDirs();

    const workers = source.memory("workers", true);

    const dirToPosition = F.dirToPosition(source.pos());

    for (const site of sites) {

      const pos = dirToPosition(site);
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
        // allocate worker, find closest, TODO prefer role=sourcer
        // find only in same room for now

        // TODO switch to list of untasked creeps which we null out assigned
        log.debug(_.chain(creeps).compact().size().value(), "left");
        let creep = _.chain(creeps).compact().map(CreepState.right).filter((cs: CreepState) => {
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
        }).sortBy(byRangeToSite).first().valueOf() as CreepState;

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

function resetAssignments(state: GlobalState) {
  log.warning("resetting creep assignments");
  state.sources().filter((s) => delete s.memory().workers).value();
  state.creeps().filter((s) => delete s.memory().working).value();
}
