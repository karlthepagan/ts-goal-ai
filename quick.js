// grab energy
[Game.rooms.W74S57.find(FIND_DROPPED_ENERGY)].map(
  e=>Game.rooms.W74S57.find(FIND_MY_CREEPS).map(c=>e.map(i=>c.pickup(i))));

// kill weakest enemy
[Game.rooms.W74S57.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER})].map(
  c=>_(Game.rooms.W74S57.find(FIND_HOSTILE_CREEPS)).sortBy(t=>t.hits).some(
  e=>e?c.attack(e):false));

// repair weakest wall
Game.rooms.W74S57.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER}).map(x=>
  [_(Game.rooms.W74S57.find(FIND_STRUCTURES,
    {filter: t=>t.structureType === STRUCTURE_WALL && t.hits > 1 && x.pos.getRangeTo(t.pos) <= 5}))
    .sortBy(t=>t.hits).first()].map(e=>x.repair(e)));

[_(Game.rooms.W74S57.find(FIND_STRUCTURES, {filter: t=>t.structureType === STRUCTURE_RAMPART}))
  .sortBy(t=>t.hits).first()].map(
  e=>Game.rooms.W74S57.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER})
    .map(c=>c.repair(e)));

[_(Game.rooms.W74S57.find(FIND_MY_CREEPS))].map(
  e=>Game.rooms.W74S57.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER})
    .map(c=>e.map(i=>i.transfer(c, RESOURCE_ENERGY))));

_(Game.rooms.W74S57.find(FIND_MY_CREEPS)).map(
  e=>e.upgradeController(Game.rooms.W74S57.controller));

// build diagonal wall
[0,1,2,3,4,5].map(i=>Game.rooms.W74S57.createConstructionSite(33-i,40+i,STRUCTURE_WALL));

_(Game.rooms.W74S57.find(FIND_MY_CREEPS)).some(
  c=>_(Game.rooms.W74S57.lookForAt(LOOK_CREEPS,c.pos.x-1,c.pos.y-1)).some(
    t=>c.transfer(t, RESOURCE_ENERGY)));
