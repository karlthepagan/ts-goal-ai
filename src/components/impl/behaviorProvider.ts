import {EventRegistry} from "../event/api/index";
import Joinpoint from "../event/api/joinpoint";
import CreepState from "../state/creepState";
import {log} from "../support/log";
import InterceptorSpec from "../event/impl/interceptorSpec";
import * as F from "../functions";
import StructureState from "../state/structureState";
import {interceptorService, globalLifecycle} from "../event/behaviorContext";
import RoomState from "../state/roomState"; // TODO leaky abstraction

const $ = {} as any;

function birthday(spawn: StructureState<Spawn>, body: string[], concievedTicks?: number) {
  return spawn.resolve(globalLifecycle)
    ? spawn.subject().spawning.remainingTime
    : 3 * body.length - F.elvis(concievedTicks, 1);
}

export function defineEvents(em: EventRegistry) {
  em.intercept(StructureState).after((i: Spawn) => i.createCreep).wait(1).advice((jp: Joinpoint<StructureState<Spawn>, string>) => {
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

  // TODO try to move most advice calls into targetBuilder calls
  em.when().spawn().ofAll().advice((jp: Joinpoint<CreepState, string>, body: string[]) => {
    if (jp.source === undefined) {
      debugger; // no event source
      throw new Error("no event source");
    }
    const creep = jp.target;
    const spawn = jp.source.target as StructureState<Spawn>;
    em.schedule(birthday(spawn, body) + 1499, creep).fireEvent("death");
  });

  em.intercept(CreepState).after(i => i.move).wait(1, (jp: Joinpoint<CreepState, void>, dir: number) => {
    const ejp = Joinpoint.withSource(jp);
    ejp.args = [jp.target.pos(), dir]; // OnMove spec: fromPos: RoomPosition, forwardDir: number
    return [ejp, ...jp.args];
  }).fireEvent("move");
  const moveTo = em.intercept(CreepState).after(i => i.moveTo);
  const moveByPath = em.intercept(CreepState).after(i => i.moveByPath);
  [moveTo, moveByPath].map(i =>
    i.wait(1, (jp: Joinpoint<CreepState, void>) => {
      const ejp = Joinpoint.withSource(jp);
      ejp.resolve(); // TODO hack to unwrap the intercepted target, should be repeated when InterceptorSpec dispatches
      ejp.args = [jp.target.pos()]; // OnMove spec: fromPos: RoomPosition, forwardDir: number
      return [ejp, ...ejp.args];
    }).advice((jp: Joinpoint<CreepState, number>, fromPos: RoomPosition) => {
      if (jp.target.resolve(globalLifecycle)) {
        jp.args[1] = F.posToDirection(fromPos)(jp.target.pos()); // TODO if 0?
        interceptorService.triggerBehaviors(jp, "move");

        // interceptorService.scheduleExec() // TODO rested event
      }
    })
  );
}

export default function registerBehaviorProvider(em: EventRegistry) {
  defineEvents(em);

  em.when().aggro().ofAll().advice((jp: Joinpoint<RoomState, void>) => {
    jp = jp;
    log.debug("AGGRO! TODO find turrets and FIRE! later do enemy priority scoring & elections");
  });

  em.when().spawn().ofAll().advice((jp: Joinpoint<CreepState, string>, body: string[], mem?: any) => {
    body = body;
    if (jp.source === undefined) {
      debugger; // no event source
      throw new Error("no event source");
    }
    const creep = jp.target;
    const spawn = jp.source.target as StructureState<Spawn>;
    const whenBorn = em.schedule(birthday(spawn, body), creep);

    if (mem !== undefined) {
      whenBorn.call().setMemory(mem); // args from createCreep call, TODO type constrain?
    }
    whenBorn.call().rescan();

    // TODO TOP is WAG (usually the case)
    const vjp = InterceptorSpec.joinpointFor(creep, "move");
    vjp.unresolve();
    whenBorn.callHandler().touching(vjp, creep.pos(), TOP); // TODO automatic joinpoint from dispatch?
  });

  em.when().move().ofAll().call().touching($, $, $);

  em.when().attacked().ofAll().advice((jp: Joinpoint<CreepState|StructureState<any>, string>) => {
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
