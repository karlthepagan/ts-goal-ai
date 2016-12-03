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
import ConstructionState from "./state/constructionState";
import {registerType} from "./types";

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
  registerType(new CreepState("proto").className(), CreepState);
  registerType(new ConstructionState("proto").className(), ConstructionState);
  registerType(new EnemyCreepState("proto").className(), EnemyCreepState);
  registerType(new GlobalState("proto").className(), GlobalState);
  registerType(new MineralState("proto").className(), MineralState);
  registerType(new RoomState("proto").className(), RoomState);
  registerType(new SourceState("proto").className(), SourceState);
  registerType(new SpawnState("proto").className(), SpawnState);

  registerType(STRUCTURE_SPAWN, SpawnState);
});

bootstrap.push(() => {
  importManager.addMemoryDescription("tooAngel", new TooAngelMemory());
  importManager.addMemoryDescription("ScreepsOS", new ScreepsOsMemory());
});
