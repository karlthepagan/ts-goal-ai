import {EventRegistry} from "../event/api/index";
import SpawnState from "../state/spawnState";
import Joinpoint from "../event/api/joinpoint";
import CreepState from "../state/creepState";
import RoomState from "../state/roomState";
import {log} from "../support/log";
import InterceptorSpec from "../event/impl/interceptorSpec";
import * as F from "../functions";
import StructureState from "../state/structureState";

export default function registerBehaviorProvider(em: EventRegistry) {
  em.intercept(SpawnState).after(i => i.createCreep).wait(1).fireEvent("spawn");

  em.when().aggro().ofAll().apply((jp: Joinpoint<RoomState, void>) => {
    jp = jp;
    log.debug("AGGRO! TODO find turrets and FIRE! later do enemy priority scoring & elections");
  });

  em.when().spawn().ofAll().apply((jp: Joinpoint<SpawnState, string>) => {
    // const creep = jp.target as CreepState; // TODO implement event domain target resolution
    const creepName = jp.returnValue as string;
    const apiCreep = Game.creeps[creepName];
    const creep = CreepState.left(apiCreep);

    jp.target.resolve();
    const whenBorn = em.schedule(jp.target.subject().spawning.remainingTime, creep);
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

  const move = em.intercept(CreepState).after(i => i.move); // .or() later
  move.apply((jp: Joinpoint<CreepState, void>) => {
    const trying = jp.target.memory("try");
    trying.dir = jp.args[0];
    trying.pos = jp.target.pos();
  });
  const moveTo = em.intercept(CreepState).after(i => i.moveTo);
  const moveByPath = em.intercept(CreepState).after(i => i.moveByPath);
  [moveTo, moveByPath].map(i => i.apply((jp: Joinpoint<CreepState, void>) => {
    const trying = jp.target.memory("try");
    delete trying.dir;
    trying.pos = jp.target.pos();
  }));
  [move, moveTo, moveByPath].map(i => {
    i.wait(1).apply((jp: Joinpoint<CreepState, void>) => {
      const trying = jp.target.memory("try");
      if (trying.dir === undefined) {
        // figuring out dir from positions
        trying.dir = F.posToDirection(trying.pos)(jp.target.pos()); // TODO if 0?
      }
      jp.target.touching(jp, trying.pos, trying.dir);
    });
  });

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
