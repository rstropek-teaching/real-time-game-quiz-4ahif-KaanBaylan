"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var http = require("http");
var sio = require("socket.io");
var app = express();
var server = http.createServer(app);
var io = sio(server);
var port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log('Webserver listens on Port %d', port);
});
app.use(express.static(__dirname + '/'));
var host;
var isHost = true;
var players = [4];
var i = 0;
var selectedMode;
var num = Math.floor(Math.random() * 100) + 1;
var diffrence1 = -1;
var diffrence2 = -1;
var diffrence3 = -1;
var diffrence4 = -1;
var id1;
var id2;
var id3;
var id4;
var ids = [];
var opphero;
var count = 0;
for (var j = 0; j < 4; j++) {
    players[j] = "";
}
io.on('connection', function (socket) {
    var username = '';
    socket.on('add user', function (newUserName) {
        username = newUserName;
        if (isHost) {
            host = socket.client.id;
            isHost = false;
        }
        if (i <= 3) {
            players[i] = username;
            i++;
            socket.broadcast.emit('user joined', { players: players, i: i });
            socket.emit('user joined', { players: players, i: i });
            socket.to(host).emit('select gamemode', i);
        }
        else {
            socket.emit('error', -1);
        }
    });
    socket.on('mode selected', function (mode) {
        selectedMode = mode;
        socket.broadcast.emit('game start', mode);
    });
    socket.on('disconnect', function () {
        var ingame = false;
        var index = 0;
        var swap;
        for (var j = 0; j < players.length; j++) {
            if (players[j] === username) {
                players[j] = "";
                ingame = true;
                index = j;
            }
        }
        if (ingame && index !== (i - 1)) {
            if (index === 0) {
                isHost = true;
            }
            if (!(index === players.length - 1)) {
                for (var j = index; j < players.length - 1; j++) {
                    swap = players[j];
                    players[j] = players[j + 1];
                    players[j + 1] = swap;
                }
            }
        }
        if (ingame) {
            i--;
        }
        if (ingame) {
            socket.broadcast.emit('user left', players);
            if (!isHost) {
                socket.to(host).emit('select gamemode', i);
            }
            else {
                socket.broadcast.emit('host left');
            }
        }
    });
    socket.on('guessed Number', function (guess) {
        if (diffrence1 === -1) {
            if (num > guess) {
                diffrence1 = num - guess;
            }
            else {
                diffrence1 = guess - num;
            }
            id1 = socket.client.id;
            socket.emit('wait for opp');
        }
        else {
            switch (selectedMode) {
                case 1:
                    if (num > guess) {
                        diffrence2 = num - guess;
                    }
                    else {
                        diffrence2 = guess - num;
                    }
                    id2 = socket.client.id;
                    if (diffrence1 < diffrence2) {
                        ids.push(id1);
                        ids.push(id2);
                        socket.to(id1).emit('first');
                        socket.emit('wait opp hero', { difme: diffrence2, difopp: diffrence1 });
                    }
                    else if (diffrence1 > diffrence2) {
                        ids.push(id2);
                        ids.push(id1);
                        socket.emit('first');
                        socket.to(id1).emit('wait opp hero', { difme: diffrence1, difopp: diffrence2 });
                    }
                    else {
                        num = Math.floor(Math.random() * 100) + 1;
                        diffrence1 = -1;
                        diffrence2 = -1;
                        socket.emit('again');
                        socket.to(id1).emit('again');
                    }
                    break;
                case 2:
                    break;
                case 3:
                    break;
                case 4:
                    break;
                default:
                    socket.emit('error', -2);
            }
        }
    });
    socket.on('hero selected', function (hero) {
        count++;
        opphero = hero;
        socket.emit('wait opp sel hero');
        socket.to(ids[count]).emit('hero selection');
        socket.broadcast.emit('opp hero', opphero);
        if (ids.length == count) {
            socket.emit('begin game', false);
            socket.broadcast.emit('begin game', true);
        }
    });
    socket.on('next Turn', function () {
        socket.broadcast.emit("next Turn");
    });
    socket.on('attack', function (damage) {
        socket.broadcast.emit('attack', damage);
    });
    socket.on('blocked', function () {
        socket.broadcast.emit('blocked');
    });
    socket.on('att success', function (hp) {
        socket.broadcast.emit('att success', hp);
    });
    socket.on('dead', function () {
        socket.emit('dead');
        socket.broadcast.emit('WIN');
    });
    socket.on('heal', function (hp) {
        socket.broadcast.emit('opp heal', hp);
    });
    socket.on('paralyse', function () {
        socket.broadcast.emit('paralyse');
    });
    socket.on('steal', function (number) {
        socket.broadcast.emit('opp steal', number);
    });
    socket.on('stolen', function (stealType) {
        socket.broadcast.emit('stolen', stealType);
    });
    socket.on('destroy cards', function (data) {
        socket.broadcast.emit('destroy cards', { num1: data.num1, num2: data.num2 });
    });
    socket.on('cards destoryed', function (data) {
        socket.emit('cards destroyed', { destroyType1: data.destroyType1, destroyType2: data.destroyType2 });
    });
    socket.on('add card', function () {
        socket.broadcast.emit('add card');
    });
    socket.on('special used', function (hero) {
        socket.broadcast.emit('special used', hero);
    });
});
