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

    const $start = $('.start');
    const $startText = $('#start-text');
    const $guessNumberBtn = $('#guessNumberBtn');
    const $guessNumber = $('#guessNumber');

    const $gameWait = $('.gameWait');
    const $waitMessage = $('#waitMessage');
    const $heroselection = $('.hero-select');

    const $healer = $('#Healer');
    const $warrior = $('#Warrior');
    const $defender = $('#Defender');
    const $berserk = $('#Berserk');
    const $vampire = $('#Vampire');
    const $hydra = $('#Hydra');

    const $healerabs = $('#healerabs');
    const $warriorabs = $('#warriorabs');
    const $defenderabs = $('#defenderabs');
    const $berserkabs = $('#berserkabs');
    const $vampireabs = $('#vampireabs');
    const $hydraabs = $('#hydraabs');
    const $heroselected = $('#heroSelected');
    const $hero = $('#hero');

    const $game = $('.game');

    const $oppCooldown = $('#oppCooldown');
    const $opponentName = $('#opponentName');
    const $opponentHero = $('#opponentHero');
    const $oppHP = $('.oppHP');
    const $oppLife = $('#oppLife');
    const $oppHand = $('#opphand');

    const $turn = $('#Turn');
    const $currentCard = $('#currentCard');
    const $cardstack = $('#cardstack');

    const $playerCooldown = $('#playerCooldown');
    const $playerName = $('#PlayerName');
    const $playerHero = $('#playerHero');
    const $playerHP = $('.playerHP');
    const $playerLife = $('#playerLife');
    const $playHand = $('#hand');
    const $special = $('#special');


    let $oppheroes: any[] = [];
    let username: any;
    let coolCount: number;
    let turn: boolean;

    let connected = false;
    let $currentInput = $usernameInput.focus();
    const socket = io();

    let hand = $('#hand');
    let oppHandcount = 5;
    let playfield = $("#playfield");
    let playedCard: any;

    let damage: number = 1;
    let attacked: boolean = false;
    let attackable: number = 0;
    let attackcount: number;

    let blockcount: number;

    let $hp: number = 10;
    let healcount: number = 0;
    let hasBlock: number = 0;

    let paralysed = false;
    let paralysplayed = false;

    hand.sortable({
        connectWith: "#playfield",
        revert: true
    });

    playfield.droppable({
        accept: '.card',
        drop: function (evt: any, ui: any) {
            if (turn || attacked) {
                $("#currentCard").empty();
                $("#currentCard").append('<img src="img/' + ui.draggable.attr("id") + '.png">');
                playedCard = ui.draggable.attr("id");
                ui.draggable.remove();

                cardPlayed(playedCard);
            }
        }
    });


    function insertIntoPlayerList(username: any) {
        var $player = document.createElement("li");
        $player.appendChild(document.createTextNode(username));
        $player.className = "list-group-item";

        if ($playerList) {
            $playerList.appendChild($player);
        }
    }

    function setUsername() {
        username = $usernameInput.val();

        if (username) {
            if (username.toString().trim()) {
                $loginPage.fadeOut();
                $gameSelection.show();

                socket.emit('add user', username);
            }
        }
    }

    function clearPlayerList() {
        if ($playerList) {
            let lis: any;
            while ((lis = $playerList.getElementsByTagName("li")).length > 0) {
                $playerList.removeChild(lis[0]);
            }
        }
    }

    function clearGamemodesList() {
        $modeBattle.hide();
        $modeTriple.hide();
        $modeFourway.hide();
        $modeTeam.hide();
    }

    function cooldown(hero: any) {
        switch (hero) {
            case "healer":
                return 2;
            case "warrior":
                return 2;
            case "defender":
                return 2;
            case "berserk":
                return 3;
            case "vampire":
                return 4;
            case "hydra":
                return 4;
            default:
                return -1;
        }
    }

    function getCard(type: string) {
        let li = $('<li>').addClass('card');
        let img = $('<img>');

        li.addClass('list-inline-item');
        li.attr('align', 'center');
        li.attr('id', type);
        img.attr('src', 'img/' + type + '.png');

        li.append(img);
        $playHand.append(li);
    }

    function heal(){
        $hp++;
        
        $playerHP.text("" + $hp);

        $playerLife.attr('aria-valuenow', $hp);
        $playerLife.attr('style', 'width: ' + $hp + '0%;')

        socket.emit('heal', $hp);
    }

    function getCards() {
        for (let j = 0; j < oppHandcount; j++) {
            let li = $('<li>').append($('<img>').attr('src', 'img/BlankCard.png'));
            li.addClass('list-inline-item');
            li.addClass('card');
            li.attr('align', 'center');
            $oppHand.append(li);
        }

        for (let j = 0; j < 5; j++) {
            drawCard();
        }
    }

    function cardPlayed(playedCard: any) {
        switch (playedCard) {
            case "Attack":
                if (!attacked) {
                    if (attackable < 2) {
                        if(!paralysed){
                            socket.emit("attack", damage);
                            
                            attackable++;
                            attackcount++;
                            turn = false;
                            setTurn(turn);
    
                            switch ($hero.val()) {
                                case "berserk": case "warrior":
                                    damage = 1;
                                    break;
                            }                            
                        }
                        else{
                            alert('You are paralysed! You can`t attack this round!')
                            getCard('Attack');
                        }
                    }
                    else {
                        alert('You can only attack twice per Round!');
                        getCard('Attack');
                    }
                }
                else {
                    alert('Play your Block-Action!');
                    getCard('Attack');
                }
                break;
            case "Block":
                if (attacked) {
                    attacked = false;
                    socket.emit('blocked');
                    blockcount++;
                    hasBlock--;

                    switch($hero.val()){
                        case 'Defender':
                            if(blockcount === 2){
                                if ($hp >= 10) {
                                    alert('You can\'t heal yourself! You are full life!');
                                    getCard('Heal');
                                    socket.emit('add card');
                                }
                                else {
                                    heal();
                                }
                            }
                            break;
                        case 'Warrior':
                            damage = 2;
                            break;
                    }
                }
                else {
                    alert('You can\'t play a Block-Action!');
                    getCard('Block');
                }

                break;
            case "Paralyse":
                if (!attacked) {
                    if(!paralysplayed){
                        socket.emit('paralyse');
                        $('#enemy').attr('style', 'background-color: green;');
                        paralysplayed=true;
                    }
                    else{
                        alert("You can only paralyse your enemy once per round!");
                        getCard('Paralyse');
                    }
                }
                else {
                    alert('Play your Block-Action!');
                    getCard('Paralyse');
                }
                break;
            case "Steal":
                if (!attacked) {
                    if($oppHand.length > 0){
                        let number: number = Math.floor(Math.random() * $oppHand.length) + 1;
                        socket.emit('steal', number);
                    }
                    else{
                        alert('Opponent has no cards to steal!');
                        getCard('Steal');
                    }
                }
                else {
                    alert('Play your Block-Action!');
                    getCard('Steal');
                }
                break;
            case "Heal":
                if (!attacked) {
                    if(healcount < 1){
                        if ($hp >= 10) {
                            alert('You can\'t heal yourself! You are full life!');
                            getCard('Heal');
                        }
                        else {
                            heal();
                            healcount++;
                        }
                    }
                    else if($hero.val() === "healer" && healcount < 2){
                        if ($hp >= 10) {
                            alert('You can\'t heal yourself! You are full life!');
                            getCard('Heal');
                        }
                        else {
                            heal();
                            healcount++;
                        }
                    }
                    else{
                        alert('You can only heal yourself once!');
                        getCard('Heal');
                    }
                }
                else {
                    alert('Play your Block-Action!');
                    getCard('Heal');
                }
                break;
        }
    }

    function drawCard() {
        let num = Math.floor(Math.random() * 13) + 1;
        let li = $('<li>').addClass('card');
        let img = $('<img>');

        li.addClass('list-inline-item');
        li.attr('align', 'center');

        switch (num) {
            case 1: case 2: case 3: case 4: case 5:
                li.attr('id', 'Attack');
                img.attr('src', 'img/Attack.png');
                li.append(img);
                $playHand.append(li);
                break;
            case 6: case 7: case 8: 
                li.attr('id', 'Block');
                img.attr('src', 'img/Block.png');
                li.append(img);
                $playHand.append(li);
                hasBlock++;
                break;
            case 9: case 10:
                li.attr('id', 'Steal');
                img.attr('src', 'img/Steal.png');
                li.append(img);
                $playHand.append(li);
                break;
            case 11: 
                li.attr('id', 'Paralyse');
                img.attr('src', 'img/Paralyse.png');
                li.append(img);
                $playHand.append(li);
                break;
            case 12: case 13:
                li.attr('id', 'Heal');
                img.attr('src', 'img/Heal.png');
                li.append(img);
                $playHand.append(li);
                break;
        }
    }

    function setTurn(turn: boolean) {
        $turn.empty();
        if (turn) {
            $turn.append('Your Turn!');
        }
        else {
            $turn.append('Opponents Turn!');
        }
    }

    function setSpecialCount(coolCount: number) {
        $playerCooldown.empty();
        if (coolCount > 0) {
            $playerCooldown.append(coolCount + ' Rounds Cooldown');
        }
        else {
            $playerCooldown.append('Special is ready! \nClick to use!');
        }
    }

    function oppCardPlayed() {
        oppHandcount--;
        $oppHand.empty();

        for (let j = 0; j < oppHandcount; j++) {
            let li = $('<li>').append($('<img>').attr('src', 'img/BlankCard.png'));
            li.addClass('list-inline-item');
            li.addClass('card');
            li.attr('align', 'center');
            $oppHand.append(li);
        }
    }

    function oppDrawCard(){ 
        oppHandcount++;
        $oppHand.empty();

        for (let j = 0; j < oppHandcount; j++) {
            let li = $('<li>').append($('<img>').attr('src', 'img/BlankCard.png'));
            li.addClass('list-inline-item');
            li.addClass('card');
            li.attr('align', 'center');
            $oppHand.append(li);
        }
    }
    
    function syncOppHP(hp: number){
        $oppHP.empty();
        $oppHP.text("" + hp);

        $oppLife.removeAttr('aria-valuenow');
        $oppLife.removeAttr('style');

        $oppLife.attr('aria-valuenow', hp);
        $oppLife.attr('style', 'width: ' + hp + '0%;')
    }

    socket.on('attack', function (damage: number) {
        $currentCard.empty();
        $currentCard.append('<img src="img/Attack.png">');

        oppCardPlayed();

        if (hasBlock > 0) {
            attacked = true;
            alert('Play your Block-Action!');
        }
        else {
            $hp = $hp - damage;

            if ($hp <= 0) {
                socket.emit('dead');
            }
            else {
                $playerHP.empty();
                $playerHP.text("" + $hp);

                $playerLife.attr('aria-valuenow', $hp);
                $playerLife.attr('style', 'width: ' + $hp + '0%;')

                socket.emit('att success', $hp);
            }
        }
    });

    socket.on('blocked', function () {
        turn = true;
        setTurn(turn);

        oppCardPlayed();

        $currentCard.empty();
        $currentCard.append('<img src="img/Block.png">');
    });

    socket.on('att success', function (opphp: number) {
        turn = true;
        setTurn(turn);
        
        syncOppHP(opphp);

        switch ($hero.val()) {
            case "berserk":
                if (attackcount < 4) {
                    attackable = 1;
                }
                else {
                    attackcount = 0;
                }
                break;
            case 'vampire':
                if(attackcount == 3){
                    if ($hp >= 10) {
                        getCard("Heal");
                        socket.emit('add card');
                    }
                    else {
                        $hp++;

                        $playerHP.empty();
                        $playerHP.append("" + $hp);

                        $playerLife.attr('aria-valuenow', $hp);
                        $playerLife.attr('style', 'width: ' + $hp + '0%;')

                        attackcount = 0;

                        socket.emit('heal', $hp);
                    }
                }
                break;
            case "hydra":
                if (opphp > $hp) {
                    damage = 2;
                }
                else {
                    damage = 1;
                }
                break;
        }
    });

    socket.on('WIN', function () {
        alert("You are the Winner!!!");
    });

    socket.on('dead', function () {
        alert("You lost... R.I.P.");
    });

    socket.on('opp healed', function(hp: any){
        $currentCard.empty();
        $currentCard.append('<img src="img/Heal.png">');

        oppCardPlayed();
        syncOppHP(hp);
    });

    socket.on('paralyse', function(){
        $currentCard.empty();
        $currentCard.append('<img src="img/Paralyse.png">');

        $('#player').attr('style', 'background-color: green;');
        oppCardPlayed();

        paralysed = true;
    });

    socket.on('opp steal', function(id: number){
        $currentCard.empty();
        $currentCard.append('<img src="img/Steal.png">');

        let curHand = $("#hand");
        let counter = 0;
        let stealType;

        $.each(curHand, function () {
            $(this).find('li').each(function(){
                let action = $(this);
    
                if(id === counter){
                    stealType = action.attr('id');
                    action.remove();
                }
    
                counter++;
            })
        });

        alert('Your '+stealType+'-Action was stolen!');

        if(stealType === "Block"){
            hasBlock--;
        }

        socket.emit('stolen', stealType);
    });

    socket.on('stolen', function(stealType: any){
        getCard(stealType);
        oppCardPlayed();
    });

    socket.on('destroy cards', function(data: any){
        let curHand = $("#hand");
        let counter = 0;
        let destroyType1: any = null;
        let destroyType2: any = null;

        $.each(curHand, function () {
            $(this).find('li').each(function(){
                let action = $(this);

                if(data.num1 === counter || data.num2 === counter){
                    if(destroyType1 == null){
                        destroyType1 = action.attr('id');                    
                    }
                    else if(destroyType2 == null){
                        destroyType2 = action.attr('id');
                    }
                    action.remove();
                }

                counter++;
            })
        });

        socket.emit('cards destroyed', {destroyType1: destroyType1, destroyType2: destroyType2});
    });

    socket.on('cards destroyed', function(data: any){
        alert('Destroyed cards: \n'+data.destroyType1+' and '+data.destroyType2);
        oppCardPlayed();
        oppCardPlayed();
    });

    socket.on('user joined', function (data: any) {
        if (data.i > 1) {
            $wait.fadeOut();
            $wait2.show();
        }

        clearPlayerList();
        for (let j = 0; j < data.players.length; j++) {
            insertIntoPlayerList(data.players[j]);
        }
    });

    socket.on('user left', function (players: any) {
        clearPlayerList();
        for (let j = 0; j < players.length; j++) {
            insertIntoPlayerList(players[j]);
        }
    });

    socket.on('select gamemode', function (i: number) {
        $wait.fadeOut();
        $wait2.fadeOut();
        $gamemodes.show();
        let $game;

        clearGamemodesList();
        if ($gamemodesList) {
            if (i == 2) {
                if ($gamemodesList) {
                    $modeBattle.show();
                }
            }

            if (i == 3) {
                if ($gamemodesList) {
                    $modeTriple.show();
                }
            }

            if (i == 4) {
                if ($gamemodesList) {
                    $modeFourway.show();
                    $modeTeam.show();
                }
            }
        }
    });

    socket.on('game start', function (mode: number) {
        switch (mode) {
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

    socket.on('wait for opp', function () {
        $gameWait.show();
    });

    socket.on('first', function () {
        $gameWait.hide();
        $heroselection.fadeIn();
    });

    socket.on('wait opp hero', function (data: any) {
        $gameWait.show();
        $waitMessage.empty();
        $waitMessage.append("You lost the Guess! \n Waiting for Opponent to select Hero! \n Your Diffrence: " + data.difme + " \n Opponent Diffrence: " + data.difopp);
    });

    socket.on('wait opp sel hero', function () {
        $heroselection.hide();
        $gameWait.show();
        $waitMessage.empty();
        $waitMessage.append('Wait for the Others to select their Heroes!');
    });

    socket.on('again', function () {
        $startText.empty();
        $startText.append("Diffrences were same! Try again!");
        $gameWait.hide();
        $start.show();
    });

    socket.on('opp hero', function (opphero: any) {
        $oppheroes.push(opphero);
    });

    socket.on('begin game', function (start: boolean) {
        $gameWait.hide();

        $playerHero.attr('src', 'img/' + $hero.val() + '.png');
        $playerName.append("You");
        coolCount = cooldown($hero.val());
        $playerCooldown.append(coolCount + ' Rounds Cooldown');

        let opphero = $oppheroes[0];

        $opponentHero.attr('src', 'img/' + opphero + '.png');
        $opponentName.append("Opponent");
        $oppCooldown.append(cooldown(opphero) + ' Rounds Cooldown');

        $game.fadeIn();
        getCards();
        turn = start;

        if (start) {
            $turn.append('Your Turn!');
        }
        else {
            $turn.append('Opponents Turn!');
        }
    });

    socket.on('hero selection', function () {
        $gameWait.hide();
        $heroselection.fadeIn();
    });

    socket.on('next Turn', function () {
        turn = true;
        setTurn(turn);
        drawCard();
        drawCard();
    });

    socket.on('host left', function () {
        document.documentElement.innerHTML = '';
        alert("Host left! \n Game closed!")
    });

    socket.on('error', function (code: number) {
        switch (code) {
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

    socket.on('special used', function(hero: any){
        let s: string = "Opponent used his Special:\n";
        switch(hero){
            case "healer":
                s += "Get a Heal-Action";
                break;
            case "warrior":
                s += "Get an Attack-Action";
                break;
            case "defender":
                s += "Get an Block-Action";
                break;
            case "berserk":
                s += "One Attack does 2 damage";
                break;
            case "vampire":
                s += "Paralyse enemy and heal 1 hp";
                break;
            case "hydra":
                s += "Destroy 2 cards";
                break;
        }
        alert(s);
    });

    socket.on('add card', function(){
        oppDrawCard();
    });

    $special.click(function () {
        if (turn) {
            if(coolCount <= 0){
                let cooldownReset = true;

                switch ($hero.val()) {
                    case "warrior":
                        getCard('Attack');
                        socket.emit('add card');              
                        break;
                    case "defender":
                        getCard('Block');
                        socket.emit('add card');                        
                        break;
                    case "healer":
                        getCard('Heal');
                        socket.emit('add card');  
                        break;
                    case "vampire":
                        if ($hp == 10) {
                            alert('You can\'t heal yourself! You are full life!');
                            cooldownReset=false;
                        }
                        else {
                            heal();
                            socket.emit('paralyse');
                        }    
                        break;
                    case "berserk":
                        damage = 2;
                        break;
                    case "hydra":
                        if($oppHand.length > 0){
                            let num1, num2: number;

                            num1 =  Math.floor(Math.random() * $oppHand.length) + 1;
                            num2 =  Math.floor(Math.random() * $oppHand.length) + 1;
                            socket.emit("destroy cards", {num1: num1, num2: num2});
                        }
                        else{
                            alert("Opponent has no cards to destroy!");
                            cooldownReset=false;
                        }
                        break;
                }
    
                if(cooldownReset){
                    coolCount = cooldown($hero.val())
                    setSpecialCount(coolCount);
    
                    socket.emit('special used', $hero.val());
                }
                
            }
        }
    });

    $cardstack.click(function () {
        if (turn) {
            turn = false;
            setTurn(turn);

            oppDrawCard();
            oppDrawCard();
    
            attackable = 0;
            coolCount--;
            setSpecialCount(coolCount);
            
            if($hero.val() === "berserk"){
                attackcount = 0;
            }

            healcount = 0;

            $('#enemy').removeAttr('style');        
            $('#player').removeAttr('style');
            socket.emit('next Turn');
        }
    });

    $usernameEnter.click(function () {
        setUsername();
    });

    $modeBattle.click(function () {
        socket.emit('mode selected', 1);
    });

    $modeTriple.click(function () {
        // socket.emit('mode selected', 2);
        alert('Not availible');
    });

    $modeFourway.click(function () {
        // socket.emit('mode selected', 3);
        alert('Not availible');
    });

    $modeTeam.click(function () {
        // socket.emit('mode selected', 4);
        alert('Not availible');
    });

    $guessNumberBtn.click(function () {
        $start.hide();
        socket.emit('guessed Number', $guessNumber.val());
    });

    $healer.click(function () {
        $hero.val("healer");
    });

    $healer.mouseenter(function () {
        $healerabs.fadeIn();
    });

    $healer.mouseleave(function () {
        $healerabs.fadeOut();
    });

    $warrior.click(function () {
        $hero.val("warrior");
    });

    $warrior.mouseenter(function () {
        $warriorabs.fadeIn();
    });

    $warrior.mouseleave(function () {
        $warriorabs.fadeOut();
    });

    $defender.click(function () {
        $hero.val("defender");
    });

    $defender.mouseenter(function () {
        $defenderabs.fadeIn();
    });

    $defender.mouseleave(function () {
        $defenderabs.fadeOut();
    });

    $berserk.click(function () {
        $hero.val("berserk");
    });

    $berserk.mouseenter(function () {
        $berserkabs.fadeIn();
    });

    $berserk.mouseleave(function () {
        $berserkabs.fadeOut();
    });

    $vampire.click(function () {
        $hero.val("vampire");
    });

    $vampire.mouseenter(function () {
        $vampireabs.fadeIn();
    });

    $vampire.mouseleave(function () {
        $vampireabs.fadeOut();
    });

    $hydra.click(function () {
        $hero.val("hydra");
    });

    $hydra.mouseenter(function () {
        $hydraabs.fadeIn();
    });

    $hydra.mouseleave(function () {
        $hydraabs.fadeOut();
    });

    $heroselected.click(function () {
        socket.emit("hero selected", $hero.val());
    });
});
