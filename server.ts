import * as express from 'express';
import * as http from 'http';
import * as sio from 'socket.io'
import { homedir } from 'os';
const app = express();
const server = http.createServer(app);
const io = sio(server);

const port: (string | number) = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Webserver listens on Port %d', port);
});

app.use(express.static(__dirname + '/'));

let host: string;
let isHost: boolean = true;
let players: any[] = [4];
let i: number = 0;

for (let j = 0; j < 4; j++) {
  players[j] = "";
}

io.on('connection', function (socket) {
  let username = '';

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

  socket.on('mode selected', function(mode){
    socket.broadcast.emit('game start', mode);
  });

  socket.on('disconnect', function () {
    let ingame = false;
    let index = 0;
    let swap: any;

    for (let j = 0; j < players.length; j++) {
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
        for (let j = index; j < players.length - 1; j++) {
          swap = players[j];
          players[j] = players[j + 1];
          players[j + 1] = swap;
        }
      }
      i--;
    }

    if(ingame){
      socket.broadcast.emit('user left', players);
      if(!isHost){
        socket.to(host).emit('select gamemode',i);
      }
      else{
        socket.broadcast.emit('host left');
      }
    }
  });
});