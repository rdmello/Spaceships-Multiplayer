var canvas;
var ctx; 
var page_width; 
var page_height; 
var mouseData = []; 

var ws = new WebSocket('wss://rylan.coffee/spaceships/'); 

ws.onopen = function (event) {
    ws.send(JSON.stringify({
        type: "clientDimensions", 
        data: {
            page_width : page_width, 
            page_height: page_height
        }
    })); 
    console.log("Connected to WebSocket server"); 
};

var id; 
var game; 
ws.onmessage = function (evt) {
    var message = JSON.parse(evt.data); 
    if (message.type === 'id') {
        id = message.id; 
        
        // Add Event Listener for Mouse Move
        // This is done AFTER initial message to avoid
        // empty mousemove messages
        canvas.addEventListener("mousemove", readMousePosn); 
        canvas.addEventListener("touchmove", readMousePosn); 

        setTimeout(sendMousePosn, 200); 

    } else if (message.type === 'update') {
        game = message.data; 
        updateCanvas(id, game);
    };
}

var updateCanvas = function (id, game) {

    // Find current base
    var myBase = (game.bases.filter(function (base) {return base.id === id;}))[0];

    // Clear canvas
    ctx.fillStyle = "white"; 
    ctx.fillRect (-100, -100, page_width + 200, page_height + 200); 
  
    // Translate Canvas to Global Game Coordinates
    // such that myBase is at the center
    ctx.translate(-(myBase.posX - (page_width/2)), -(myBase.posY - (page_height/2)));

    // Draw Grid
    ctx.strokeStyle = "rgb(220,230,230)";  
    var boxSize = 20;
    for (var i=0; i<game.gameSettings.mapWidth/boxSize; i++) {
        for (var j=0; j<game.gameSettings.mapHeight/boxSize; j++) {
            ctx.strokeRect(i*boxSize, j*boxSize, boxSize, boxSize); 
        }
    };

    // Draw Bases and Spaceships
    game.bases.forEach(function (base) {
        // Draw base
        ctx.fillStyle = "black"; 
        ctx.beginPath();
        ctx.arc(base.posX,base.posY,base.size/2,0,2*Math.PI);
        ctx.fill();

        // Draw base maxShipDistance
        ctx.strokeStyle = "black"; 
        ctx.beginPath();
        ctx.arc(base.posX,base.posY,base.maxShipDistance,0,2*Math.PI);
        ctx.stroke();

        // Draw spaceships
        ctx.fillStyle = "black"; 
        base.ships.forEach(function (ship) {
            ctx.fillRect(ship.posX-(ship.size/2), ship.posY-(ship.size/2), ship.size, ship.size); 
        }); 

        // Write Score of each player
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(Math.floor(base.life), base.posX, base.posY); 
    }); 

    // Draw Bots
    var foodBots = game.bots.filter(function (bot) {return bot.damage > 0}); 
    var killBots = game.bots.filter(function (bot) {return bot.damage <= 0}); 

    ctx.fillStyle = "green"; 
    foodBots.forEach(function (bot) {
        ctx.beginPath();
        ctx.arc(bot.posX,bot.posY,bot.size/2,0,2*Math.PI);
        ctx.fill();
    }); 
    
    ctx.fillStyle = "red"; 
    killBots.forEach(function (bot) {
        ctx.beginPath();
        ctx.arc(bot.posX,bot.posY,bot.size/2,0,2*Math.PI);
        ctx.fill();
    }); 

    // Translate the canvas back to original coordinates
    ctx.translate(myBase.posX - (page_width/2), myBase.posY - (page_height/2));
}

// Initialize HTML canvas on page load
document.addEventListener("DOMContentLoaded", function (event) {
    // Set global canvas element
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');

    // Resize canvas to fit full window
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
    page_width = window.innerWidth; 
    page_height = window.innerHeight; 

    mouseData = [page_width/2, page_height/2]; 
});

var readMousePosn = function (event) {
    mouseData = [-(page_width/2)+event.pageX, -(page_height/2)+event.pageY]; 
}

var sendMousePosn = function () {
    ws.send(JSON.stringify({type: 'mousePosition', data: mouseData}));
    setTimeout(sendMousePosn, 100); 
}
