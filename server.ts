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

let selectedMode: number;

let num: number = Math.floor(Math.random() * 100) + 1;

let diffrence1: number = -1;
let diffrence2: number = -1;
let diffrence3: number = -1;
let diffrence4: number = -1;

let id1: any;
let id2: any;
let id3: any;
let id4: any;
let ids: any[] = [];

let opphero: any;
let count = 0;

for (let j = 0; j < 4; j++) {
  players[j] = "";
}

io.on('connection', function (socket) {
  let username = '';

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

  socket.on('mode selected', function(mode){
    selectedMode = mode;
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
    }

    if(ingame){
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

  socket.on('guessed Number', function(guess: number){
    if(diffrence1 === -1){
      if(num > guess){
        diffrence1 = num - guess;
      }
      else{
        diffrence1 = guess - num;
      }

      id1 = socket.client.id;
      socket.emit('wait for opp');
    }
    else{
      switch(selectedMode){
      case 1:
        if(num > guess){
          diffrence2 = num - guess;
        }
        else{
          diffrence2 = guess - num;
        }

        id2 = socket.client.id;

        if(diffrence1 < diffrence2){
          ids.push(id1);
          ids.push(id2);
          socket.to(id1).emit('first');
          socket.emit('wait opp hero',{difme: diffrence2, difopp: diffrence1});
        }
        else if(diffrence1 > diffrence2){
          ids.push(id2);
          ids.push(id1);
          socket.emit('first');
          socket.to(id1).emit('wait opp hero',{difme: diffrence1, difopp: diffrence2});
        }
        else{
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

  socket.on('hero selected', function(hero: any){
    count++;

    opphero = hero;
    socket.emit('wait opp sel hero');
    socket.to(ids[count]).emit('hero selection');

    socket.broadcast.emit('opp hero', opphero);
    
    if(ids.length == count){
      socket.emit('begin game', false);
      socket.broadcast.emit('begin game', true);
    }
  });

  socket.on('next Turn', function(){
    socket.broadcast.emit("next Turn");
  });

  socket.on('attack', function(damage: number){
    socket.broadcast.emit('attack', damage);
  });

  socket.on('blocked', function(){
    socket.broadcast.emit('blocked');
  });

  socket.on('att success', function(hp: any){
    socket.broadcast.emit('att success', hp);
  });

  socket.on('dead', function(){
    socket.emit('dead');
    socket.broadcast.emit('WIN');
  });

  socket.on('heal', function(hp: any){
    socket.broadcast.emit('opp heal', hp);
  });

  socket.on('paralyse', function(){
    socket.broadcast.emit('paralyse');
  });

  socket.on('steal', function(number: number){
    socket.broadcast.emit('opp steal', number);
  });

  socket.on('stolen', function(stealType: any){
    socket.broadcast.emit('stolen', stealType);
  });

  socket.on('destroy cards', function(data: any){
    socket.broadcast.emit('destroy cards',{num1: data.num1, num2: data.num2});
  });

  socket.on('cards destoryed', function(data: any){
    socket.emit('cards destroyed', {destroyType1: data.destroyType1, destroyType2: data.destroyType2});
  });

  socket.on('add card', function(){
    socket.broadcast.emit('add card');
  });

  socket.on('special used', function(hero: any){
    socket.broadcast.emit('special used', hero);
  });
});