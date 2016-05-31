// Rylan Dmello 27 May 2016

var app = require('http').createServer(handler);
var WebSocketServer = require('ws').Server; 
var wss = new WebSocketServer({ server: app }); 
var fs = require('fs'); 
var files = ['/index.html', '/index.js', '/index.css']; 

app.listen(3100); 

function handler (req, res) {
    var position = (req.url === '/') ? 0 : files.indexOf(req.url); 
    if (position > -1) {
        fs.readFile(__dirname + files[position], function (err, data){
            if (err) {
                res.writeHead(500); 
                res.end('Error loading index.html'); 
            } else { 
                console.log('Requesting: ' + req.url); 
                res.writeHead(200); 
                res.end(data); 
            };
        }); 
    } else {
        res.writeHead(404); 
        res.end('Error file not found'); 
    }; 
}

wss.on('connection', function (ws) {
    
    console.log("Client Connected!"); 
    var my_data = new_user(); 
    var setup_msg = {data: my_data, type: "setup"}; 
    ws.send(JSON.stringify(setup_msg)); 
    
    ws.on('message', function (data) {
        var message = JSON.parse(data);  
        if (message.type === "mousePosition") {
            update_user(message.data); 
        }
    }); 

    ws.on('close', function () {
        console.log("Client disconnected"); 
        // remove_user(my_data.id); 
    }); 

    // Attach updateID function when other clients leave
    my_data.updateID = function () {
        ws.send(JSON.stringify({type: 'updateID', newid: my_data.id})); 
    }
}); 

wss.on('connection', function (ws) {

    var base = game.addBase(ws); 
    ws.send(JSON.stringify({type:'id', id: base.id}); 
    game.sendUpdates(ws); 

    ws.on('message', function (data) {
        var message = JSON.parse(data);
        if (message.type === 'mousePosition') {
            base.updateMousePosition(message.data); 
            game.fixOOB(base); 
            var collisions = game.checkBaseCollisions(base); 
            game.resolveCollisions(base, collisions); 
            game.removeDeadBases(); 
            game.sendUpdates(ws);
        }; 
    }); 

    ws.on('close', function () {
        game.tearDownBase(base); 
    }); 
}); 

// Setup up broadcast function for websockets
wss.broadcast = function (data) {
    wss.clients.forEach(function (client) {
        client.send(data, function (error) {
            if(error) {console.log("Socket broadcast error"); }; 
        });
    }); 
};

var game_context = (function(){
    var game_data = {}; 
    game_data.map_width = 3000; 
    game_data.map_height = 2000; 
    game_data.num_users = 0; 
    game_data.user_data = []; 
    return game_data; 
})(); 

var new_user = function () {
    var my_data = {}; 
    my_data.id = game_context.user_data.length; 
    my_data.x = game_context.map_width*Math.random(); 
    my_data.y = game_context.map_height*Math.random(); 
    my_data.mouseX = my_data.x;
    my_data.mouseY = my_data.y;
    game_context.num_users += 1; 
    game_context.user_data.push(my_data); 
    return my_data; 
};

var remove_user = function (num) {
    game_context.user_data.splice(num, 1);
    for (var i=num; i<game_context.num_users-1; i++) {
        game_context.user_data[i].id = i; 
        game_context.user_data[i].updateID(); 
    }
    game_context.num_users -= 1; 
}

var update_user = function (data) {
    var my_data = game_context.user_data[data.id]; 
    if(data.mouseX !== null) my_data.mouseX = data.mouseX;
    if(data.mouseY !== null) my_data.mouseY = data.mouseY; 
}; 

var checkIfOOB = function (data) {
    if (data.x < 0) data.x = 0; 
    if (data.y < 0) data.y = 0; 
    if (data.x > game_context.map_width) data.x = game_context.map_width; 
    if (data.y > game_context.map_height) data.y = game_context.map_height; 
}

var recalculate = function () {
    for (var i = 0; i < game_context.num_users; i++) {
        var my_data = game_context.user_data[i];
        var diffX = (my_data.mouseX - my_data.x)/5;
        var diffY = (my_data.mouseY - my_data.y)/5; 
        my_data.x += diffX;
        my_data.y += diffY; 
        my_data.mouseX += diffX; 
        my_data.mouseY += diffY; 
        checkIfOOB(my_data); 
    };
    wss.broadcast(JSON.stringify({data: game_context.user_data, type: 'drawNow'})); 
    // console.log(game_context.user_data); 
    setTimeout(recalculate, 100); 
}

setTimeout(recalculate, 100); 


