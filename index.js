var canvas;
var ctx; 
var page_width; 
var page_height; 
var mouseData = []; 

var ws = new WebSocket('wss://rylan.coffee/spaceships/'); 

ws.onopen = function (event) {
    console.log("Connected to WebSocket server"); 
};

var id; 
var game; 
ws.onmessage = function (evt) {
    var message = JSON.parse(evt.data); 
    if (message.type === 'id') {
        id = message.id; 
        
        // Add Event Listener for Mouse Move
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
    for (var i=0; i<150; i++) {
        for (var j=0; j<100; j++) {
            ctx.strokeRect(i*20, j*20, 20, 20); 
        }
    };

    // Draw Bases and Spaceships
    game.bases.forEach(function (base) {
        // Draw base
        ctx.fillStyle = "black"; 
        ctx.fillRect(base.posX-(base.size/2), base.posY-(base.size/2), base.size, base.size);
        ctx.strokeStyle = "black"; 
        ctx.strokeRect(base.posX-(base.maxShipDistance), base.posY-(base.maxShipDistance), 2*base.maxShipDistance, 2*base.maxShipDistance);

        // Draw spaceships
        base.ships.forEach(function (ship) {
            ctx.fillStyle = "red"; 
            ctx.fillRect(ship.posX-(ship.size/2), ship.posY-(ship.size/2), ship.size, ship.size); 
        }); 
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
