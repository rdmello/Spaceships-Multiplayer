var canvas;
var ctx; 
var my_data; 
var page_width; 
var page_height; 

var socket = io('/', {path: '/spaceships/socket.io'}); 

socket.on('setup', function (data) {
    console.log(data); 
    my_data = data; 
    drawGrid(data); 
}); 

socket.on('drawNow', function (data) {
    refreshCanvas(); 
    drawGrid(data[my_data.id]);
    
    ctx.translate(-(data[my_data.id].x - (page_width/2)), -(data[my_data.id].y - (page_height/2)));
    for (var i=0; i<data.length; i++) {
        var thisdata = data[i]; 
        drawCircle(thisdata); 
    }
    ctx.translate(data[my_data.id].x - (page_width/2), data[my_data.id].y - (page_height/2));
}); 

var drawGrid = function (data) {
    // console.log(data); 
    my_data.x = data.x; 
    my_data.y = data.y; 

    ctx.translate(-(data.x - (page_width/2)), -(data.y - (page_height/2)));
    ctx.strokeStyle = "blue"; 
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
    var data = {
        id: my_data.id,
        mouseX: my_data.x-(page_width /2)+event.pageX, 
        mouseY: my_data.y-(page_height/2)+event.pageY
    };
    console.log(data); 
    socket.emit('mousePosition', data); 
}
