import {EventRegistry} from "../event/index";
import SpawnState from "../state/spawnState";
import Joinpoint from "../behavior/joinpoint";
import CreepState from "../state/creepState";
import RoomState from "../state/roomState";
import {log} from "../support/log";

export default function registerBehaviorProvider(em: EventRegistry) {
  debugger;
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

    const whenBorn = em.schedule(time - 1, creep);
    const mem = jp.args[2];
    if (mem !== undefined) {
      whenBorn.call().setMemory(jp.args[2]); // args from createCreep call, TODO type constrain?
    }
    whenBorn.call().rescan();

    // TODO construct virtual move event TOP is WAG (usually the case)
    whenBorn.call().touching(jp.asVoid(), creep.pos(), TOP);

    // old pattern
    // State.events.schedule(time - 1, state)
    //   .onSpawn().thenCall(state.setMemory, mem).thenCall(state.rescan)
    //   .andThen().onMove().thenCall(state.touching);
  });
}
