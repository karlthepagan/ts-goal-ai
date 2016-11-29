import {log} from "./support/log";
import {importManager} from "./import/importSingleton";
import registerStateScoreProvider from "./score/stateScoreProvider";
import GlobalState from "./state/globalState";
import TooAngelMemory from "./import/tooAngelMemory";

export const bootstrap: (() => void)[] = [];

bootstrap.push(() => {
  log.debug("bootstrap");
});

bootstrap.push(() => {
  GlobalState.protectMemory("config");
});

bootstrap.push(() => {
  registerStateScoreProvider();
});

bootstrap.push(() => {
  importManager.addMemoryDescription("tooAngel", new TooAngelMemory());
});
