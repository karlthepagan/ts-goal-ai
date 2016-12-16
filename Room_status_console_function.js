/**
 * returns string for a link that can be clicked from the console
 * to change which room you are viewing. Useful for other logging functions
 * @param roomArg {Room|RoomObject|RoomPosition|RoomName}
 * @returns {string}
 */
global.roomLink = function(roomArg) {
    if (roomArg instanceof Room) {
        roomArg = roomArg.name;
    } else if (roomArg.pos != undefined) {
        roomArg = roomArg.pos.roomName;
    } else if (roomArg.roomName != undefined) {
        roomArg = roomArg.roomName;
    } else if (typeof roomArg === 'string') {
        roomArg = roomArg;
    } else {
        console.log(`Invalid parameter to roomLink global function: ${roomArg} of type ${typeof roomArg}`);
    }
    return `<a href="#!/room/${roomArg}">${roomArg}</a>`;
};

/**
 * console function that prints:
 *  gcl status
 *  rcl status and significant missing structures for each claimed room
 */
global.roomLevels = function() {
    let gclString = `===== GCL =====`;
    let gclPercentage = ((Game.gcl.progress / Game.gcl.progressTotal) * 100.0).toFixed(2)
    gclString += `\n\tLEVEL: ${Game.gcl.level}\tprogress: ${gclPercentage} %\t<progress value="${Game.gcl.progress}" max="${Game.gcl.progressTotal}"></progress>`;
    let string = "\n===== Room Levels =====";

    // \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
    // change the contents of these 2 functions to take advantage of your own caching
    // commented out my own cached stuff to put in code that should work regardless of code base
    let structures = Object.keys(Game.structures).map(id=>Game.structures[id]);
    let structuresByRoom = _.groupBy(structures, s=>s.room.name);
    for (let roomName in structuresByRoom) structuresByRoom[roomName] = _.groupBy(structuresByRoom[roomName], 'structureType');
    function getRoomStructuresByType(room) {
        return structuresByRoom[room.name] || {};
        //return room.structuresByType;
    }
    let constructionSites = Object.keys(Game.constructionSites).map(id=>Game.constructionSites[id]);
    let sitesByRoom = _.groupBy(constructionSites, s=>s.pos.roomName);
    for (let roomName in sitesByRoom) sitesByRoom[roomName] = _.groupBy(sitesByRoom[roomName], 'structureType');
    function getRoomConstructionSitesByType(room) {
        return sitesByRoom[room.name] || {};
        //return room.memory.constructionSiteIds;
    }
    // /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\

    Object.keys(Game.rooms).map(name => Game.rooms[name])
        .filter( r => r.controller && r.controller.my )
        .sort( (a,b) => b.controller.level - a.controller.level || b.controller.progress - a.controller.progress )
        .forEach( room => {
            let rclPercentage = ((room.controller.progress / room.controller.progressTotal) * 100.0).toFixed(1);
            rclPercentage = " " + rclPercentage;
            rclPercentage = rclPercentage.substring(rclPercentage.length - 4);

            string += `\n\n\tRoom ${roomLink(room.name)} :\tLevel ${room.controller.level}`;
            if (room.controller.level < 8) {
                string += `\t\tProgress: ${rclPercentage} %\t<progress value="${room.controller.progress}" max="${room.controller.progressTotal}"></progress>`;
            }

            let roomLevel = room.controller.level;
            Object.keys(CONTROLLER_STRUCTURES).forEach( type => {
                let numStructures = (getRoomStructuresByType(room)[type] || []).length;
                numStructures += (getRoomConstructionSitesByType(room)[type] || []).length;
                let numPossible = CONTROLLER_STRUCTURES[type][roomLevel];
                if (type !== STRUCTURE_CONTAINER && numPossible < 2500 && numStructures < numPossible) {
                    string += `\t | <font color="#00ffff">${type}'s missing: ${numPossible - numStructures}</font>`;
                }
            });
        });

    console.log(gclString + string);
};