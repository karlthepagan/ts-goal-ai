import {EventRegistry} from "../event/index";
import Joinpoint from "../event/joinpoint";
import CreepState from "../state/creepState";

export default function registerBehaviorProvider(em: EventRegistry) {
  debugger;
  em.when().spawn().ofAll().apply((jp: Joinpoint<CreepState, string>) => {
    const creep = jp.target as CreepState;
    const time = jp.args[1].length * 3; // TODO get event source? Spawn.spawning.remainingTime?
    const whenBorn = em.schedule(time - 1, creep);
    whenBorn.call().setMemory(jp.args[2]); // args from createCreep call, TODO type constrain?
    whenBorn.call().rescan();

    // TODO construct virtual move event TOP is WAG (usually the case)
    whenBorn.call().touching(jp.asVoid(), creep.pos(), TOP);

    // const creepName = jp.returnValue as string;
    // const creep = Game.creeps[creepName];
    // const state = CreepState.left(creep);
    // State.events.schedule(time - 1, state) // TODO restore
    //   .onSpawn().thenCall(state.setMemory, mem).thenCall(state.rescan)
    //   .andThen().onMove().thenCall(state.touching);

  });
}
