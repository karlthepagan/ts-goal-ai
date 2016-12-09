// LATER when harvesting, update prediction of when energy will be full
// TODO use apply and externalize dependency to rescoring
// const afterHarvest = em.intercept(CreepState).after(i => i.harvest);
// afterHarvest.call().score("venergy");
// afterHarvest. // TODO schedule event for when energy is full
// TODO react to unexpected energy changes by rescore and react

// later gather args before wait
// em.intercept(CreepState).after(i => i.move)
//   .save(jp => [jp.target.pos(), jp.args[0]]) // first challenge, save
//   .wait(1).call(i => i.touching); // next challenge, give call optional param
