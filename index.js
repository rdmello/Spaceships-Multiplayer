var canvas;
var ctx; 
var my_data; 
var page_width; 
var page_height; 
var grid_color = "rgb(220,230,230)"; 

var ws = new WebSocket('wss://rylan.coffee/spaceships/'); 

ws.onopen = function (event) {
    console.log("Connected to WebSocket server"); 
};

ws.onmessage = function (event) {
    var message = JSON.parse(event.data); 
    if (message.type === "setup") {
        console.log(message.data); 
        my_data = message.data; 
        setTimeout(sendMousePosn, 30); 
        drawGrid(message.data); 
    } else if (message.type === "updateID") {
        my_data.id = message.newid;
    } else if (message.type === "drawNow") {
        refreshCanvas(); 
        drawGrid(message.data[my_data.id]);
        
        ctx.translate(-(message.data[my_data.id].x - (page_width/2)), -(message.data[my_data.id].y - (page_height/2)));
        for (var i=0; i<message.data.length; i++) {
            var thisdata = message.data[i]; 
            drawCircle(thisdata); 
        }
        ctx.translate(message.data[my_data.id].x - (page_width/2), message.data[my_data.id].y - (page_height/2));
    };
}; 

var drawGrid = function (data) {
    // console.log(data);
    my_data.mouseX += data.x - my_data.x;
    my_data.mouseY += data.y - my_data.y;
    my_data.x = data.x; 
    my_data.y = data.y; 

    ctx.translate(-(data.x - (page_width/2)), -(data.y - (page_height/2)));
    ctx.strokeStyle = grid_color; 
    for (var i=0; i<150; i++) {
        for (var j=0; j<100; j++) {
            ctx.strokeRect(i*20, j*20, 20, 20); 
        }
    }
    ctx.translate(data.x - (page_width/2), data.y - (page_height/2));
}

var refreshCanvas = function() {
    ctx.fillStyle="white"; 
    ctx.fillRect(-100,-100,page_width+200, page_height+200); 
    ctx.fillStyle="black"; 
}

var drawCircle = function (data) {
    ctx.fillRect(data.x-20, data.y-20, 40, 40); 
};

// Initialize HTML canvas on page load
document.addEventListener("DOMContentLoaded", function (event) {
    // Set global canvas element
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgb(200,0,0)"; 

    // Resize canvas to fit full window
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
    page_width = window.innerWidth; 
    page_height = window.innerHeight; 

    // Add Event Listener for Mouse Move
    canvas.addEventListener("mousemove", readMousePosn); 
    canvas.addEventListener("touchmove", readMousePosn); 
});

var readMousePosn = function (event) {
    my_data.mouseX = my_data.x-(page_width /2)+event.pageX;
    my_data.mouseY = my_data.y-(page_height/2)+event.pageY;
}

var sendMousePosn = function () {
    ws.send(JSON.stringify({type: 'mousePosition', data: my_data}));
//  console.log(my_data); 
    setTimeout(sendMousePosn, 200); 
}
