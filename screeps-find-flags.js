function find_flags (room, flag_type) {
    var [room, room_name] = __get_room_and_name(room);
    var cached = __get_cache(room_name, flag_type);
    if (cached) {
        return cached;
    }
    var flag_def = flag_definitions [flag_type];
    if (room) {
        var flag_list = room.find(FIND_FLAGS, {
            'filter': {
                'color': flag_def [0],
                'secondaryColor': flag_def [1]
            }
        });
    }
    else {
        var flag_list = [];
        var flag_names = Object.keys(Game.flags);
        for (var i = 0; i < flag_names.length; i++) {
            var flag_name = flag_names [i];
            var flag = Game.flags [flag_name];
            if (flag.pos.roomName == room_name && flag.color == flag_def [0] && flag.secondaryColor == flag_def [1]) {
                flag_list.push(flag);
            }
        }
    }
    if (_room_flag_cache.has(room_name)) {
        _room_flag_cache.get(room_name).set(flag_type, flag_list);
    }
    else {
        _room_flag_cache.set(room_name, new Map([[flag_type, flag_list]]));
    }
    return flag_list;
};