import {EventRegistry} from "../event/api/index";
import SpawnState from "../state/spawnState";
import Joinpoint from "../event/api/joinpoint";
import CreepState from "../state/creepState";
import RoomState from "../state/roomState";
import {log} from "../support/log";
import {botMemory} from "../../config/config";
// import * as F from "../functions";

export default function registerBehaviorProvider(em: EventRegistry) {
  const commands = botMemory() as Commands;

  if (commands.debugBuilders) {
    debugger; // Commands.debugBuilders = true
  }

  em.intercept(SpawnState).after(i => i.createCreep).wait(1).fireEvent("spawn");

  em.when().aggro().ofAll().apply((jp: Joinpoint<RoomState, void>) => {
    jp = jp;
    log.debug("AGGRO! TODO find turrets and FIRE! later do enemy priority scoring & elections");
  });

  em.when().spawn().ofAll().apply((jp: Joinpoint<any, string>) => {
    // const creep = jp.target as CreepState; // TODO implement event domain target resolution
    const time = jp.args[0].length * 3; // TODO get event source? Spawn.spawning.remainingTime?
    const creepName = jp.returnValue as string;
    const apiCreep = Game.creeps[creepName];
    const creep = CreepState.left(apiCreep);

    const whenBorn = em.schedule(time - 1, creep); // jp in this builder is undefined!
    // TODO consider assigning jp into the schedule chain? SRC => DST stuff!!!!
    const mem = jp.args[2];
    if (mem !== undefined) {
      whenBorn.call().setMemory(jp.args[2]); // args from createCreep call, TODO type constrain?
    }
    whenBorn.call().rescan();

    // TODO construct virtual move event TOP is WAG (usually the case)
    whenBorn.call().touching(jp.asVoid(), creep.pos(), TOP);
  });

  const move = em.intercept(CreepState).after(i => i.move); // .or() later
  move.apply((jp: Joinpoint<CreepState, void>) => {
    debugger;
    if (jp.target === undefined) {
      return;
    }
    const trying = jp.target.memory("try");
    trying.dir = jp.args[0];
    trying.pos = jp.target.pos();
  });
  move.wait(1).apply((jp: Joinpoint<CreepState, void>) => {
    debugger;
    if (jp.target === undefined) {
      return;
    }
    const trying = jp.target.memory("try");
    jp.target.touching(jp, trying.pos, trying.dir);
  });

  const moveTo = em.intercept(CreepState).after(i => i.moveTo);
  const moveByPath = em.intercept(CreepState).after(i => i.moveByPath);
  [moveTo, moveByPath].map(i => i.apply((jp: Joinpoint<CreepState, void>) => {
    debugger;
    if (jp.target === undefined) {
      return;
    }
    const trying = jp.target.memory("try");
    delete trying.dir;
    trying.pos = jp.target.pos();
  }));
  // em.intercept(CreepState).after(i => i.moveTo)
  // em.intercept(CreepState).after(i => i.moveByPath)
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
