interface Commands {
  /**
   * tell all creeps and structures to rebalance their jobs
   */
  shuffle: boolean;

  /**
   * reload memoized configurations
   */
  commit: boolean;

  /**
   * don't process work logic until cleared
   */
  pause: boolean;

  /**
   * last think time
   */
  last: number;

  /**
   * procedural transfers
   */
  hardxfer: boolean;

  /**
   * procedural idle
   */
  hardidle: boolean;

  /**
   * breakpoint at start of builders
   */
  debugBuilders: boolean;

  /**
   * start a breakpoint in grind
   */
  break: boolean;
}

interface Options {
  /**
   * BURN IT DOWN, and fuck that guy who's attackin you
   *
   * build walls and stop banking RCL
   *
   * TODO pathing mazes, cpu harassment
   */
  respawn: boolean;

  /**
   * final stage, stop mining and spend it all then automatically die
   *
   * TODO trade minerals for energy
   */
  suicide: boolean;

  /**
   * cpu exhaustion threshold
   */
  cpuOut: number;

  /**
   * cpu warning threshold
   */
  cpuWarn: number;

  /**
   * number of ticks between gamestate rescoring
   */
  rescoreTicks: number;

  /**
   * number of ticket between remote room thinks
   */
  remoteRoomscanTicks: number;

  /**
   * number of ticks between visible room discovery and think
   */
  roomscanTicks: number;

  /**
   * number of incomplete (bot) think ticks before we need to shuffle
   */
  failedTicksToShuffle: number;

  /**
   * turn off Proxy interception of api calls which route thru api(State<any>)
   */
  disableBehaviors: boolean;
}
