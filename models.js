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
        this.bases.forEach(function (base, idx){
            if (base.id === id) {
                oldbase = this.bases.splice(idx, 1); 
            }
        });
        return oldbase; 
    }, 

    fixOOB: function (base) {
        var mw = this.gameSettings.mapWidth; 
        var mh = this.gameSettings.mapHeight; 

        if (base.posX < 0 ) base.posX = 0 - base.posX;  
        if (base.posY < 0 ) base.posY = 0 - base.posY;  
        if (base.posX > mw) base.posX = mw- base.posX;  
        if (base.posY > mh) base.posY = mh- base.posY;  

        base.ships.forEach(function (ship, idx) {
            if (ship.posX < 0) { 
                ship.posX = 0 - ship.posX; 
                ship.velX = 0 - ship.velX; 
            } else if (ship.posX > mw ) { 
                ship.posX = mw- ship.posX;  
                ship.velX = 0 - ship.velX; 
            }; 

            if (ship.posY < 0) { 
                ship.posY = 0 - ship.posY; 
                ship.velY = 0 - ship.velY; 
            } else if (ship.posY > mh) {
                ship.posY = mh- ship.posY;  
                ship.velY = 0 - ship.velY; 
            }; 
        }); 
    }, 

    checkBaseCollisions: function (base) {
        return this.bases.filter(function (el) {
            var maxDist = Math.max(base.maxShipDistance, el.maxShipDistance); 
            var xdiff = Math.abs(base.posX - el.posX); 
            var ydiff = Math.abs(base.posY - el.posY); 
            return ((xdiff < maxDist) && (ydiff < maxDist));
        }); 
    }, 

    resolveCollisions: function (base, collisions) {
        collisions.forEach(function (el) {

        }); 
    }, 

        // Add a base to the removal Queue
    tearDownBase: function (base) {
        this.removalQueue.push(base); 
    }, 

    removeDeadBases: function () {
        this.removalQueue.forEach(function (base) {
            var oldbase = this.removeBase(base.id); 
            this.addBase(oldbase.socket, oldbase.id); 
        }); 
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
    this.score = [0, 0]; 
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

    removeShip: function (idx) {
        this.ships.splice(idx, 1); 
    },

    updateMousePosition: function (newMousePos) { 
        if (newMousePos[0] !== null) this.mousePosition[0] = newMousePos[0]; 
        if (newMousePos[1] !== null) this.mousePosition[1] = newMousePos[1]; 
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

    pack: function () {
        return JSON.stringify({data: this, type: 'setup'}); 
    }
}; 

/* SHIP OBJECT
 * Summarizes the spaceship properties. Does not need
 * an ID.
 */
function Ship (base) {
    var theta = 2*Math.PI*Math.random();  
    this.posX = base.posX+((base.maxShipDistance+base.size)*Math.cos(theta)/2); 
    this.posY = base.posY+((base.maxShipDistance+base.size)*Math.sin(theta)/2); 
    this.velX = base.maxShipVel*Math.sin(theta);
    this.velY = base.maxShipVel*Math.cos(theta); 
    this.size = 20; 
    this.multVel = 0.1; 
    this.multAcc = 0.1; 
    this.damage = 10; 
}

Ship.prototype = {
    constructor: Ship,

    updatePosition: function (base) {
        var diffX = this.posX - base.posX; 
        var diffY = this.posY - base.posY;
        var theta = Math.atan(diffY/diffX); 
        var disp = Math.sqrt((diffX*diffX) + (diffY*diffY)); 
        this.velX += this.multAcc*Math.cos(theta)*((1/(disp-base.size))+(1/(base.maxShipDistance-disp)));
        this.velY += this.multAcc*Math.sin(theta)*((1/(disp-base.size))+(1/(base.maxShipDistance-disp)));
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

exports.newGame = new Game(); 
