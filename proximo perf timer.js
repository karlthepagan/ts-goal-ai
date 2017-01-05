global.timers = {};
global.startTimer = function (name) {
    timers[name] = Game.cpu.getUsed();
};
global.pollTimer = function (name) {
    if(name === "cpu") return Game.cpu.getUsed();
    return Game.cpu.getUsed() - timers[name];
};
global.logTimer = function(name){
    if(Memory.timer === undefined) Memory.timer = {};
    var poll = pollTimer(name);
    if(Memory.timer[name] === undefined
        || Memory.timer[name].t === undefined
        || (Memory.timer[name].t + poll) >= Number.MAX_VALUE){

        // t => timeTotal, c => count, lt => LastTick, tc => totalTickCount, it => initialTick
        Memory.timer[name] = {t: 0, c:0, lt: 0, tc: 0, it: Game.time};
    }
    Memory.timer[name].t += poll;
    Memory.timer[name].c++;
    if(Memory.timer[name].lt < Game.time) {
        Memory.timer[name].tc += 1;
        Memory.timer[name].lt = Game.time;
    }
};
global.getTimer = function(name){
    if(Memory.timer === undefined
        || Memory.timer[name] === undefined
        || Memory.timer[name].t === undefined) return undefined;

    return Memory.timer[name];
};
global.clearTimers = function(){
    if(Memory.timer !== undefined) delete(Memory.timer);
    return true;
};
global.getTimerLog = function(name){
    var t = getTimer(name);
    if(t === undefined){
        return undefined;
    }
    else {
        var totalTicks = Game.time - t.it + 1;
        if(totalTicks != t.tc) {
            return (t.t / t.c).toFixed(3) + " on " + t.c + " samples for " + name + " in " + t.tc + "/" + totalTicks + " ticks. "
                + (t.t / t.tc).toFixed(3) + "/"
                + (t.t / totalTicks).toFixed(3) + " cpu/tick.";
        }
        else {
            return (t.t / t.c).toFixed(3) + " on " + t.c + " samples for " + name + " in " + t.tc + " ticks. "
                + (t.t / t.tc).toFixed(3) + " cpu/tick.";
        }
    }
};