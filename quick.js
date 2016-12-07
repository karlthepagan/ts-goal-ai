// grab energy
[Game.rooms.W74S57.find(FIND_DROPPED_ENERGY)].map(
  e=>Game.rooms.W74S57.find(FIND_MY_CREEPS).map(c=>e.map(i=>c.pickup(i))));

// kill weakest enemy
[_(Game.rooms.W74S57.find(FIND_HOSTILE_CREEPS)).sortBy(t=>t.hits).first()].map(
  e=>Game.rooms.W74S57.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER})
    .map(c=>c.attack(e)));

// repair weakest wall
[_(Game.rooms.W74S57.find(FIND_STRUCTURES, {filter: t=>t.structureType === STRUCTURE_WALL}))
  .sortBy(t=>t.hits).first()].map(
  e=>Game.rooms.W74S57.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER})
    .map(c=>c.repair(e)));

[_(Game.rooms.W74S57.find(FIND_STRUCTURES, {filter: t=>t.structureType === STRUCTURE_RAMPART}))
  .sortBy(t=>t.hits).first()].map(
  e=>Game.rooms.W74S57.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER})
    .map(c=>c.repair(e)));

[_(Game.rooms.W74S57.find(FIND_MY_CREEPS))].map(
  e=>Game.rooms.W74S57.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER})
    .map(c=>e.map(i=>i.transfer(c, RESOURCE_ENERGY))));

// build diagonal wall
[0,1,2,3,4,5].map(i=>Game.rooms.W74S57.createConstructionSite(33-i,40+i,STRUCTURE_WALL));
