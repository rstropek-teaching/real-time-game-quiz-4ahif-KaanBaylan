import { text } from "body-parser";
declare const io: SocketIOStatic;

$(function () {
    const $window = $(window);
    const $usernameEnter = $('.usernameEnter');
    const $usernameInput = $('.usernameInput');
    const $loginPage = $('.login.page');
    
    const $gameSelection = $('.gameSelection');
    const $playerList = document.getElementById("playerList");
    const $gamemodes = $('.gamemodes');
    const $gamemodesList = document.getElementById('gamemodes');
    
    const $wait = $('.wait');
    const $wait2 = $('.wait2');
    
    const $modeBattle = $('#battle');
    const $modeTriple = $('#triple');
    const $modeFourway = $('#fourway');
    const $modeTeam = $('#team');

    let username;
    let connected = false;
    let $currentInput = $usernameInput.focus();
    const socket = io();

    $usernameEnter.click(function(){
        setUsername();
    });

    $modeBattle.click(function(){
        socket.emit('mode selected', 1);
    });

    $modeTriple.click(function(){
        socket.emit('mode selected', 2);
    });

    $modeFourway.click(function(){
        socket.emit('mode selected', 3);
    });

    $modeTeam.click(function(){
        socket.emit('mode selected', 4);
    });

    function insertIntoPlayerList(username: any) {
        var $player = document.createElement("li");
        $player.appendChild(document.createTextNode(username));
        $player.className = "list-group-item";

        if($playerList){
            $playerList.appendChild($player);      
        }
    }

    function setUsername() {
        username = $usernameInput.val();

        if(username){
            if (username.toString().trim()) {
                $loginPage.fadeOut();
                $gameSelection.show();

                socket.emit('add user', username);
            }
        }
    }

    function clearPlayerList(){
        if($playerList){
            let lis: any;
            while((lis = $playerList.getElementsByTagName("li")).length > 0) {
                $playerList.removeChild(lis[0]);
            }
        }
    }
    
    function clearGamemodesList(){
        $modeBattle.hide();
        $modeTriple.hide();
        $modeFourway.hide();
        $modeTeam.hide();
    }

    socket.on('user joined', function(data: any){
        if(data.i > 1){
            $wait.fadeOut();
            $wait2.show();
        }   

        clearPlayerList();
        for(let j = 0; j < data.players.length; j++){
             insertIntoPlayerList(data.players[j]);
        }
    });

    socket.on('user left', function(players: any){
        clearPlayerList();
        for(let j = 0; j < players.length; j++){
             insertIntoPlayerList(players[j]);
        }
    });

    socket.on('select gamemode', function(i: number){
        $wait.fadeOut();
        $wait2.fadeOut();
        $gamemodes.show();
        let $game;

        clearGamemodesList();
        if($gamemodesList){
            if(i == 2){
                if($gamemodesList){
                    $modeBattle.show();                    
                }
            }

            if(i == 3){        
                if($gamemodesList){
                    $modeTriple.show();
                }
            }

            if(i == 4){
                if($gamemodesList){
                    $modeFourway.show();
                    $modeTeam.show();
                }
            }
        }
    });

    socket.on('game start', function(mode: number){
        switch(mode){
            case 1:
                window.location.replace("modes/battle.html");
                break;
            case 2:
                window.location.replace("modes/triple.html");
                break;
            case 3:
                window.location.replace("modes/fourway.html");
                break;
            case 4:
                window.location.replace("modes/team.html");
                break;
            default:
                socket.emit('error', -2);
        }
    });

    socket.on('host left', function(){
        document.documentElement.innerHTML = '';        
        alert("Host left! \n Game closed!")
    });

    socket.on('error', function(code: number){
        switch(code){
            case -1:
                document.documentElement.innerHTML = '';            
                alert('Game is full!');
                break;
            case -2:
                document.documentElement.innerHTML = '';
                alert("If you get this Error, you did something wrong ¯\\_(ツ)_/¯");        
                break;
        }
    });
});