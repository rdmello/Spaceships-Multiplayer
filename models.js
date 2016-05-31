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
        maxBaseVel: 100, 
        maxShipVel: 200
    };
    this.bases = []; 
    this.removalQueue = []; 
    this.totalUsers = 0; 
};

Game.prototype = {
    constructor: Game,

    addBase: function (socket, id) {
        this.totalUsers++; 
        this.bases.push(new Base(this, socket, id)); 
    },

    removeBase: function (id) {
        this.bases.forEach(function (base, idx){
            if (base.id === id) {
                this.bases.splice(idx, 1); 
            }
        });
    }, 
    
    checkIfOOB: function (base) {
        if (this.posX < 0) this.posX = 0 - this. posX;  
        if (this.posY < 0) this.posY = 0 - this. posY;  
        if (this.posX >  0) this.posX = 0 - this. posX;  
        if (this.posY < 0) this.posY = 0 - this. posY;  
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
            this.removeBase(base.id); 
        }; 
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
    this.maxShipDistance = 10;  
    this.mousePosition = []; 
    this.socket; 
}; 

Base.prototype = {
    constructor: Base, 

    addShip: function () {
        this.ships.push(new Ship(this)); 
    }, 

    removeShip: function (idx) {
        this.ships.splice(idx, 1); 
    }

    updateMousePosition: function (newMousePos) { 
        if (newMousePos[0] !== null) this.mousePosition[0] = newMousePos[0]; 
        if (newMousePos[1] !== null) this.mousePosition[1] = newMousePos[1]; 
        updatePosition(); 
    }, 

    updatePosition: function () {
        var diffX = (this.mousePosition[0] - this.posX)*this.multVel; 
        var diffY = (this.mousePosition[1] - this.posY)*this.multVel; 
        this.posX += diffX; 
        this.posY += diffY;
        this.mouseX += diffX; 
        this.mouseY += diffY; 
        this.ships.forEach(function (ship) {
            ship.updatePosition(); 
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
    var theta = 2*pi*Math.random();  
    this.posX = base.posX+(base.maxShipDistance*Math.cos(theta)); 
    this.posY = base.posY+(base.maxShipDistance*Math.sin(theta)); 
    this.velX = maxShipVel*Math.sin(theta) 
        this.velY = maxShipVel*Math.cos(theta) 
        this.size = 20; 
    this.multVel = 30; 
    this.multAcc = 20; 
    this.damage = 10; 
}

// Convenience function to generate GUID. 
// Taken from: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
var generate_GUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}
