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

/* BASE OBJECT
 * Describes the bases or planets for each user. 
 * Also contains user data like score, id, and mousePosition
 */
function Base (game, socket, id) {
    this.id = typeof id === 'undefined' ? generate_GUID() : id; 
    this.posX = Math.floor(game.gameSettings.mapWidth *Math.random()); 
    this.posY = Math.floor(game.gameSettings.mapHeight*Math.random()); 
    this.size = 100; 
    this.life = 100; 
    this.multVel = 0.2;  
    this.ships = []; 
    this.removalQueue = []; 
    this.score = 100; 
    this.maxShipDistance = 200;  
    this.maxShipVel = 20;
    this.mousePosition = []; 
    this.socket; 
}; 

Base.prototype = {
    constructor: Base, 

    addShip: function () {
        var ship = new Ship(this); 
        this.ships.push(ship); 
        return ship; 
    }, 

    addShips: function (num) {
        var actualNum = typeof num === 'undefined' ? 1 : num; 
        for (var i = 0; i < num; i++) {
            this.ships.push(new Ship(this)); 
        }; 
    },

    removeShip: function (id) {
        var that = this; 
        var oldShip; 
        this.ships.forEach(function (el, idx) {
            if (id === el.id) {
                oldShip = that.ships.splice(idx, 1); 
            }; 
        }); 
        return oldShip; 
    },

    updateMousePosition: function (newMousePos) { 
        if (newMousePos[0] !== null) this.mousePosition[0] = this.posX + newMousePos[0]; 
        if (newMousePos[1] !== null) this.mousePosition[1] = this.posY + newMousePos[1]; 
        this.updatePosition(); 
    }, 

    updatePosition: function () {
        var diffX = (this.mousePosition[0] - this.posX)*this.multVel; 
        var diffY = (this.mousePosition[1] - this.posY)*this.multVel; 
        this.posX += diffX; 
        this.posY += diffY;
        this.mousePosition[0] += diffX; 
        this.mousePosition[1] += diffY; 
        var that = this; 
        this.ships.forEach(function (ship) {
            ship.updatePosition(that); 
        }); 
    }, 

    removeDeadShips: function () {
        var that = this; 
        this.removalQueue.forEach(function (ship) {
            that.removeShip(ship.id); 
        }); 
    }, 

    pack: function () {
        return JSON.stringify({data: this, type: 'setup'}); 
    }
}; 

/* SHIP OBJECT
 * Summarizes the spaceship properties. Does not need
 * an ID.
 */
function Ship (base) {
    this.id = generate_GUID(); 
    var theta = 2*Math.PI*Math.random();  
    this.posX = base.posX+((base.maxShipDistance+base.size)*Math.cos(theta)/2); 
    this.posY = base.posY+((base.maxShipDistance+base.size)*Math.sin(theta)/2); 
    this.velX = base.maxShipVel*Math.sin(theta);
    this.velY = base.maxShipVel*Math.cos(theta); 
    this.size = 20; 
    this.multVel = 0.8+(0.4*Math.random()); 
    this.multAcc = 0.002+(0.001*Math.random()); 
    this.maxVel = 80 + (40*Math.random()); 
    this.damage = 10; 
}

Ship.prototype = {
    constructor: Ship,

    updatePosition: function (base) {
        var diffX = this.posX - base.posX; 
        var diffY = this.posY - base.posY;
        var theta = Math.atan2(diffY,diffX); 
        var disp = Math.sqrt((diffX*diffX) + (diffY*diffY)); 
        // this.velX += this.multAcc*Math.cos(theta)*((1/(disp-base.size))+(1/(base.maxShipDistance-disp)));
        // this.velY += this.multAcc*Math.sin(theta)*((1/(disp-base.size))+(1/(base.maxShipDistance-disp)));
        // this.velX += (-1)*this.multAcc*Math.cos(theta)*(Math.pow(disp,3));
        // this.velY += (-1)*this.multAcc*Math.sin(theta)*(Math.pow(disp,3));
        this.velX += this.multAcc*Math.cos(theta)*((1/disp)-(Math.pow(disp,2)));
        this.velY += this.multAcc*Math.sin(theta)*((1/disp)-(Math.pow(disp,2)));
        this.velX = (Math.abs(this.velX) > this.maxVel) ? this.maxVel*Math.sign(this.velX) : this.velX; 
        this.velY = (Math.abs(this.velY) > this.maxVel) ? this.maxVel*Math.sign(this.velY) : this.velY; 

        this.posX += this.multVel*this.velX; 
        this.posY += this.multVel*this.velY; 
    }
}

// Convenience function to generate GUID. 
// Taken from: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
var generate_GUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

// Polyfill for Math.sign from 
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
Math.sign = Math.sign || function(x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
        return x;
    }
    return x > 0 ? 1 : -1;
}

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
