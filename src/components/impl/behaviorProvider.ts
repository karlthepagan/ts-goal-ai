import {EventRegistry} from "../event/api/index";
import SpawnState from "../state/spawnState";
import Joinpoint from "../event/api/joinpoint";
import CreepState from "../state/creepState";
import {log} from "../support/log";
import InterceptorSpec from "../event/impl/interceptorSpec";
import * as F from "../functions";
import StructureState from "../state/structureState";
import EnemyCreepState from "../state/enemyCreepState";
import {interceptorService} from "../event/behaviorContext"; // TODO leaky abstraction

const $ = {} as any;

export function defineEvents(em: EventRegistry) {
  em.intercept(SpawnState).after(i => i.createCreep).wait(1).apply((jp: Joinpoint<SpawnState, string>) => {
    debugger;
    const creepName = jp.returnValue as string;
    const apiCreep = Game.creeps[creepName]; // complex because creep doesn't exist until now
    if (apiCreep === undefined) {
      debugger; // TODO spawn failed
      throw new Error("spawn failed");
    }
    const creep = CreepState.right(apiCreep);
    const eventJp = Joinpoint.withSource(jp, creep, creep.getId());
    eventJp.resolve();
    interceptorService.triggerBehaviors(eventJp, "spawn"); // .fireEvent("spawn") equivalent
  });

  em.when().spawn().ofAll().apply((jp: Joinpoint<CreepState, string>) => {
    log.debug("dying", jp.objectId);
    // TODO death calculation, 1499 ticks from birth?
  });

  em.intercept(CreepState).after(i => i.move).wait(1, (jp: Joinpoint<CreepState, void>) => {
    const ejp = Joinpoint.withSource(jp);
    ejp.args = [jp.target.pos(), jp.args[0]]; // OnMove spec: fromPos: RoomPosition, forwardDir: number
    return ejp;
  }).fireEvent("move");
  const moveTo = em.intercept(CreepState).after(i => i.moveTo);
  const moveByPath = em.intercept(CreepState).after(i => i.moveByPath);
  [moveTo, moveByPath].map(i =>
    i.wait(1, (jp: Joinpoint<CreepState, void>) => {
      debugger;
      const ejp = Joinpoint.withSource(jp);
      ejp.args = [jp.target.pos()]; // OnMove spec: fromPos: RoomPosition, forwardDir: number
      return ejp;
    }).apply((jp: Joinpoint<CreepState, number>) => {
      debugger;
      jp.target.resolve();
      jp.args[1] = F.posToDirection(jp.args[0])(jp.target.pos()); // TODO if 0?
      interceptorService.triggerBehaviors(jp, "move");
    })
  );
}

export default function registerBehaviorProvider(em: EventRegistry) {
  defineEvents(em);

  em.when().aggro().ofAll().apply((jp: Joinpoint<EnemyCreepState, void>) => {
    jp = jp;
    log.debug("AGGRO! TODO find turrets and FIRE! later do enemy priority scoring & elections");
  });

  em.when().spawn().ofAll().apply((jp: Joinpoint<CreepState, string>) => {
    if (jp.source === undefined) {
      debugger; // TODO no source set
      return;
    }
    const creep = jp.target;
    const spawn = jp.source.target as SpawnState;
    spawn.resolve();
    const whenBorn = em.schedule(spawn.subject().spawning.remainingTime, creep);
    // TODO consider assigning jp into the schedule chain? SRC => DST stuff!!!!
    const mem = jp.args[2];
    if (mem !== undefined) {
      whenBorn.call().setMemory(mem); // args from createCreep call, TODO type constrain?
    }
    whenBorn.call().rescan();

    // TODO TOP is WAG (usually the case)
    const vjp = InterceptorSpec.joinpointFor(creep, "move");
    vjp.unresolve();
    whenBorn.call().touching(vjp, creep.pos(), TOP); // TODO automatic joinpoint from dispatch?
  });

  em.when().move().ofAll().call().touching($, $, $);

  em.when().attacked().ofAll().apply((jp: Joinpoint<CreepState|StructureState, string>) => {
    // TODO clear assignment and retreat to spawn
    if (jp.target instanceof StructureState) {
      // LATER what do?
    } else {
      // TODO fear pheremone on current assignment, and room location
      const creep = jp.target as CreepState;
      log.debug("HELP!", creep);
    }
  });
}
/*
 * 2v - spawn when workers are needed (now procedurally) (later - AI strategy) (when good scoring work sites)
 * 3v - workers assigned to open work sites (done procedurally)
 * 3.1 - when worker is touching another worker steal energy
 * 3.2 - when worker's energy is full move to touch deposit
 * 4later - spawn scouts after all work sites have a worker spawned
 * 5 - spawn couriers after all work sites have a worker spawned
 * 6!! - workers move energy to priority storage locations (prio - couriers over harvesters)
 * 7! - workers move energy to construction sites, and work them
 * 8 - workers move to repair structures
 */
