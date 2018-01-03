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
for (var j = 0; j < 4; j++) {
    players[j] = "";
}
io.on('connection', function (socket) {
    var username = '';
    if (isHost) {
        host = socket.client.id;
        isHost = false;
    }
    socket.on('add user', function (newUserName) {
        username = newUserName;
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
});
