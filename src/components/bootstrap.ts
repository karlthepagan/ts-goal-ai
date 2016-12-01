import {log} from "./support/log";
import {importManager} from "./import/importSingleton";
import registerStateScoreProvider from "./score/stateScoreProvider";
import GlobalState from "./state/globalState";
import TooAngelMemory from "./import/tooAngelMemory";
import State from "./state/abstractState";
import {eventManager} from "./event/eventSingleton";

export const bootstrap: (() => void)[] = [];

bootstrap.push(() => {
  log.debug("bootstrap");
});

bootstrap.push(() => {
  GlobalState.protectMemory("config");
  State.setEventRegistry(eventManager);
});

bootstrap.push(() => {
  registerStateScoreProvider();
});

bootstrap.push(() => {
  importManager.addMemoryDescription("tooAngel", new TooAngelMemory());
});
