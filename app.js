// Rylan Dmello 27 May 2016

var app = require('http').createServer(handler);
var WebSocketServer = require('ws').Server; 
var wss = new WebSocketServer({ server: app }); 
var fs = require('fs'); 
var files = ['/index.html', '/index.js', '/index.css']; 
var Game = require('./models/Game.js'); 
var game = new Game(); 

console.log(game); 
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

    var base = game.addBase(ws); 
    base.addShips(3); 
    ws.send(JSON.stringify({id: base.id, type: 'id'})); 
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

