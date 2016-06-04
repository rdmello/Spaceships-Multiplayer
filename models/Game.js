// Rylan Dmello 
// Monday, 30 May 2016
// Building models for the multiplayer Spaceship game
// NB: a few design choices were made by the limited server
// hardware choice of a Raspberry Pi Zero. Specifically:
//  - WebSocket "broadcasts" were found to consume
//    excessive resources, so everything is written as
//    asynchronously as possible.
//  - There is a maximum number of players and a max number
//    of spaceships to limit usage. 

var Base = require('./Base.js');
var Bot = require('./Bot.js');

/* GAME OBJECT
 * This encapsulates the starting parameters of the game
 * and contains an array of Bases. 
 * It also maintains a count of totalusers that gives a 
 * unique ID to each new user. 
 */
function Game () {
    this.gameSettings = {
        mapWidth: 1500, 
        mapHeight: 1000,
        maxNumUsers: 10, 
        maxShips: 10, 
        maxBaseVel: 100, 
        numBots: 50
    };
    this.bases = []; 
    this.bots = []; 
    this.removalQueue = []; 
    this.totalUsers = 0; 

    // Set initial bot positions
    for (var i = 0; i < this.gameSettings.numBots; i++) {
        this.bots.push(new Bot(this)); 
    };      

    var that = this; 
    // Set updates for bots
    setInterval(function () {that.updateBotPositions();}, 100); 
};

Game.prototype = {
    constructor: Game,

    addBase: function (socket, id) {
        this.totalUsers++; 
        var base = new Base(this, socket, id); 
        this.bases.push(base); 
        return base; 
    },

    removeBase: function (id) {
        var oldbase; 
        var that = this; 
        this.bases.forEach(function (base, idx){
            if (base.id === id) {
                oldbase = that.bases.splice(idx, 1); 
            }
        });
        return oldbase; 
    }, 

    // Correct position of bases that are out of bounds.
    fixOOB: function (base) {
        var mw = this.gameSettings.mapWidth; 
        var mh = this.gameSettings.mapHeight; 

        if (base.posX < 0 ) base.posX = 0;  
        if (base.posY < 0 ) base.posY = 0;  
        if (base.posX > mw) base.posX = mw;  
        if (base.posY > mh) base.posY = mh;  
    }, 

    // Check if any bases are in attack radius of any others
    // maybe this should be in the Base.prototype?
    checkBaseCollisions: function (base) {
        return this.bases.filter(function (el) {
            return ((base.id !== el.id) && 
                    check_collision([base.posX, base.posY], base.maxShipDistance/2, [el.posX, el.posY], el.maxShipDistance/2));
        }); 
    }, 

    // Iterate over colliding bases and figure out 
    // which pairs of base-attackers and attackers-attackers
    // need to be eliminated. 
    // For each, the dead items will be added to a removal queue.
    resolveCollisions: function (base, baseCollisions) {
        
        baseCollisions.forEach(function (baseC) {
            // Check ship-ship collisions
            base.ships.forEach(function(ship1) {
                baseC.ships.forEach(function (ship2) {
                    if (check_collision([ship1.posX, ship1.posY], ship1.size/2, 
                                        [ship2.posX, ship2.posY], ship2.size/2)) {
                        base.removalQueue.push(ship1); 
                        baseC.removalQueue.push(ship2); 
                    };    
                })
            }); 
            
            // Check base-ship collisions
            baseC.ships.forEach(function (ship) {
                if (check_collision([base.posX, base.posY], base.size/2, 
                                    [ship.posX, ship.posY], ship.size/2)) {
                    base.life -= ship.damage; 
                    baseC.removalQueue.push(ship); 
                }
            }); 

            // Check ship-baseC collision
            base.ships.forEach(function (ship) {
                if (check_collision([baseC.posX, baseC.posY], baseC.size/2, 
                                    [ship.posX, ship.posY], ship.size/2)) {
                    baseC.life -= ship.damage; 
                    base.removalQueue.push(ship); 
                }
            }); 

            // Remove dead ships
            base.removeDeadShips(); 
            baseC.removeDeadShips(); 

            if (baseC.life <= 0) this.removalQueue.push(baseC); 
        }); 

        if (base.life <= 0) this.removalQueue.push(base); 
    },
        

    // Add a base to the removal Queue
    tearDownBase: function (base) {
        this.removalQueue.push(base); 
    }, 

    removeDeadBases: function () {
        var that = this; 
        this.removalQueue.forEach(function (base) {
            var oldbase = that.removeBase(base.id); 
            // that.addBase(oldbase.socket, oldbase.id); 
        });

        this.removalQueue = []; 
    },

    updateBotPositions: function () {
        var that = this; 
        this.bots.forEach(function (bot) {
            bot.posX += bot.velX; 
            bot.posY += bot.velY; 
            if ((bot.posX < 0) || (bot.posX > that.gameSettings.mapWidth )) bot.velX *= -1; 
            if ((bot.posY < 0) || (bot.posY > that.gameSettings.mapHeight)) bot.velY *= -1; 
        }); 
    }, 

    resolveBotCollisions: function (base) {
        var that = this; 
        this.bots.forEach(function (bot, idx) {
            if (check_collision([bot.posX, bot.posY], bot.size/2,
                                [base.posX, base.posY], base.size/2)) {
                base.life += bot.damage; 
                that.bots[idx] = new Bot(that); 
            }; 
        }); 
        if (base.life <= 0) this.removalQueue.push(base); 
    }, 

    sendUpdates: function (socket) {
        socket.send(this.pack()); 
    },

    // Method to send information to View layer
    pack: function () {
        return JSON.stringify({data: this, type: 'update'}); 
    }
};

// Check collision function. Takes an array of x and y coordinates
// for each point. It also takes the radius of impact of each body. 
// Returns a boolean containing collision state. 
var check_collision = function (pos1, r1, pos2, r2) {
    var xdist = pos1[0] - pos2[0]; 
    var ydist = pos1[1] - pos2[1]; 
    var dist = Math.sqrt((xdist*xdist)+(ydist*ydist)); 
    return dist < r1 + r2; 
}

module.exports = Game; 
