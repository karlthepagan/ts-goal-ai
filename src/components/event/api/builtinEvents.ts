import {globalLifecycle, interceptorService} from "../behaviorContext";
import StructureState from "../../state/structureState";
import * as F from "../../functions";
import {EventRegistry} from "./index";
import Joinpoint from "./joinpoint";
import CreepState from "../../state/creepState";
import {registerFunctionLibrary} from "./builders";
import AnonCache from "../impl/anonCache";

export function birthday(spawn: StructureState<Spawn>, body: string[], concievedTicks?: number) {
  return spawn.resolve(globalLifecycle)
    ? spawn.subject().spawning.remainingTime
    : 3 * body.length - F.elvis(concievedTicks, 1);
}

export function defineEvents(em: EventRegistry) {
  registerFunctionLibrary(AnonCache.instance);

  em.intercept(StructureState).after((i: Spawn) => i.createCreep).wait(1).advice(function(jp: Joinpoint<StructureState<Spawn>, string>) {
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
  em.when().spawn().ofAll().advice(function(jp: Joinpoint<CreepState, string>, body: string[]) {
    if (jp.source === undefined) {
      debugger; // no event source
      throw new Error("no event source");
    }
    const creep = jp.target;
    const spawn = jp.source.target as StructureState<Spawn>;
    em.schedule(birthday(spawn, body) + 1499, creep).fireEvent("death");
  });

  em.intercept(CreepState).after(i => i.move).wait(1, function(jp: Joinpoint<CreepState, void>, dir: number) {
    const ejp = Joinpoint.withSource(jp);
    ejp.args = [jp.target.pos(), dir]; // OnMove spec: fromPos: RoomPosition, forwardDir: number
    return [ejp].concat(jp.args); // [ejp, ...jp.args];
  }).fireEvent("move");
  const moveTo = em.intercept(CreepState).after(i => i.moveTo);
  const moveByPath = em.intercept(CreepState).after(i => i.moveByPath);
  [moveTo, moveByPath].map(i =>
    i.wait(1, function(jp: Joinpoint<CreepState, void>) {
      const ejp = Joinpoint.withSource(jp);
      ejp.resolve(); // TODO hack to unwrap the intercepted target, should be repeated when InterceptorSpec dispatches
      ejp.args = [jp.target.pos()]; // OnMove spec: fromPos: RoomPosition, forwardDir: number
      return [ejp].concat(ejp.args); // [ejp, ...ejp.args];
    }).advice(function(jp: Joinpoint<CreepState, number>, fromPos: RoomPosition) {
      if (jp.target.resolve(globalLifecycle)) {
        jp.args[1] = F.posToDirection(fromPos)(jp.target.pos()); // TODO if 0?
        interceptorService.triggerBehaviors(jp, "move");

        // interceptorService.scheduleExec() // TODO rested event
      }
    })
  );
}
