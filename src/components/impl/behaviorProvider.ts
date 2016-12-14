import {EventRegistry} from "../event/api/index";
import Joinpoint from "../event/api/joinpoint";
import CreepState from "../state/creepState";
import {log} from "../support/log";
import InterceptorSpec from "../event/impl/interceptorSpec";
import StructureState from "../state/structureState";
import RoomState from "../state/roomState";
import {birthday} from "../event/api/builtinEvents"; // TODO leaky abstraction

const $ = {} as any;

/**
 * TODO CRITICAL any closures inside behavior definitions must be TEST-FIRED in order to memoize the function definitions
 */
export default function registerBehaviorProvider(em: EventRegistry) {
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
