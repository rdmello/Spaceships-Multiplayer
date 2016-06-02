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

/* GAME OBJECT
 * This encapsulates the starting parameters of the game
 * and contains an array of Bases. 
 * It also maintains a count of totalusers that gives a 
 * unique ID to each new user. 
 */
function Game () {
    this.gameSettings = {
        mapWidth: 3000, 
        mapHeight: 2000,
        maxNumUsers: 20, 
        maxShips: 10, 
        maxBaseVel: 100 
    };
    this.bases = []; 
    this.removalQueue = []; 
    this.totalUsers = 0; 
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
                    check_collision([base.posX, base.posY], base.maxShipDistance, [el.posX, el.posY], el.maxShipDistance));
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
                    if (check_collision([ship1.posX, ship1.posY], ship1.size, 
                                        [ship2.posX, ship2.posY], ship2.size)) {
                        base.removalQueue.push(ship1); 
                        baseC.removalQueue.push(ship2); 
                    };    
                })
            }); 
            
            // Check base-ship collisions
            baseC.ships.forEach(function (ship) {
                if (check_collision([base.posX, base.posY], base.size, 
                                    [ship.posX, ship.posY], ship.size)) {
                    base.score -= ship.damage; 
                    baseC.removalQueue.push(ship); 
                }
            }); 

            // Check ship-baseC collision
            base.ships.forEach(function (ship) {
                if (check_collision([baseC.posX, baseC.posY], baseC.size, 
                                    [ship.posX, ship.posY], ship.size)) {
                    baseC.score -= ship.damage; 
                    base.removalQueue.push(ship); 
                }
            }); 

            // Remove dead ships
            base.removeDeadShips(); 
            baseC.removeDeadShips(); 
        }); 
    },
        

    // Add a base to the removal Queue
    tearDownBase: function (base) {
        this.removalQueue.push(base); 
    }, 

    removeDeadBases: function () {
        var that = this; 
        this.removalQueue.forEach(function (base) {
            var oldbase = that.removeBase(base.id); 
            that.addBase(oldbase.socket, oldbase.id); 
        });

        this.removalQueue = []; 
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
