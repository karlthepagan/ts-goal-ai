import {log} from "./support/log";
import {importManager} from "./import/importSingleton";
import registerStateScoreProvider from "./score/stateScoreProvider";
import GlobalState from "./state/globalState";
import TooAngelMemory from "./import/tooAngelMemory";
import State from "./state/abstractState";
import {eventManager} from "./event/eventSingleton";
import ScreepsOsMemory from "./import/screepsOsMemory";
import CreepState from "./state/creepState";
import EnemyCreepState from "./state/enemyCreepState";
import MineralState from "./state/mineralState";
import RoomState from "./state/roomState";
import SourceState from "./state/sourceState";
import SpawnState from "./state/spawnState";

export const bootstrap: (() => void)[] = [];

bootstrap.push(() => {
  log.info("bootstrap starting");
});

bootstrap.push(() => {
  GlobalState.protectMemory("config");
  State.setEventRegistry(eventManager);
});

bootstrap.push(() => {
  registerStateScoreProvider();
  eventManager.registerNamedClass(new CreepState("proto"), CreepState.vright);
  eventManager.registerNamedClass(new EnemyCreepState("proto"), EnemyCreepState.vright);
  eventManager.registerNamedClass(new GlobalState("proto"), GlobalState.game);
  eventManager.registerNamedClass(new MineralState("proto"), MineralState.vright);
  eventManager.registerNamedClass(new RoomState("proto"), RoomState.vright);
  eventManager.registerNamedClass(new SourceState("proto"), SourceState.vright);
  eventManager.registerNamedClass(new SpawnState("proto"), SpawnState.vright);
});

bootstrap.push(() => {
  importManager.addMemoryDescription("tooAngel", new TooAngelMemory());
  importManager.addMemoryDescription("ScreepsOS", new ScreepsOsMemory());
});
