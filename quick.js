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
[0,1,2].map(i=>Game.rooms.W74S57.createConstructionSite(29+i,2+i,STRUCTURE_WALL));

_(Game.rooms.W74S57.find(FIND_MY_CREEPS)).some(
  c=>_(Game.rooms.W74S57.lookForAt(LOOK_CREEPS,c.pos.x-1,c.pos.y-1)).some(
    t=>c.transfer(t, RESOURCE_ENERGY)));

_(Game.rooms.W74S57.find(FIND_MY_CREEPS)).filter(c=>c.carry.energy > 200).map(c =>
  _(Game.rooms.W74S57.lookForAtArea(LOOK_STRUCTURES, c.pos.y-3, c.pos.x-3, c.pos.y+3, c.pos.x+3, true))
    .filter(s => s.structure.hits > 1)
    .some(s => c.repair(s.structure) === 0));

const room = Game.rooms.W74S57;
const towerRepairRange = 10;
room.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER}).map(c=>
    _(room.find(FIND_HOSTILE_CREEPS)).sortBy(t=>t.hits)
        .some(e=>e?c.attack(e):false)
    || c.energy < 700
    || _(ramparts).filter(s=>s.hits<1000).sortBy(s=>s.hits).some(s=>c.repair(s) === 0)
    || c.energy < 800
    || _(room.lookForAtArea(LOOK_STRUCTURES,
          c.pos.y-towerRepairRange, c.pos.x-towerRepairRange, c.pos.y+towerRepairRange, c.pos.x+towerRepairRange, true))
      .map(s=>s.structure).filter(s => s.hits > 1).sortBy(s => s.hits).some(s => c.repair(s) === 0)
);

let towerRepairRange = 11;
_(Game.rooms.W74S57.lookForAtArea(LOOK_STRUCTURES,
  40-towerRepairRange, 36-towerRepairRange, 40+towerRepairRange, 36+towerRepairRange, true))
  .map(s=>s.structure).filter(s => s.hits > 1).sortBy(s => s.hits);

Game.rooms.W74S57.find(FIND_MY_STRUCTURES, {filter: s=>s.structureType === STRUCTURE_TOWER}).map(
  c=>Game.rooms.W74S57.lookForAtArea(LOOK_STRUCTURES, c.pos.y - towerRepairRange, c.pos.x - towerRepairRange, c.pos.y + towerRepairRange, c.pos.x + towerRepairRange, true).map(JSON.stringify))

// STOP at 1700 energyCapacity or ScreepsOS will quickly starve 2 sources
Game.spawns.Spawn1.createCreep(_.times(15, _.constant(WORK)).concat(CARRY, CARRY, MOVE, MOVE));

Room.serializePath([
  {"x":16,"y":34,"dx":0,"dy":1,"direction":5},
  {"x":15,"y":35,"dx":-1,"dy":1,"direction":6},
  {"x":14,"y":34,"dx":-1,"dy":-1,"direction":8},
  {"x":13,"y":33,"dx":-1,"dy":-1,"direction":8},
  {"x":13,"y":32,"dx":0,"dy":-1,"direction":1},
  {"x":14,"y":32,"dx":1,"dy":0,"direction":3}
]);

Room.serializePath([
  {"x":14,"y":32,"dx":-1,"dy":-1,"direction":8},
  {"x":13,"y":32,"dx":-1,"dy":0,"direction":7},
  {"x":13,"y":33,"dx":0,"dy":1,"direction":5},
  {"x":14,"y":34,"dx":1,"dy":1,"direction":4}
]);
