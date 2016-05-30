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
        mapWidth = 3000, 
        mapHeight = 2000,
        maxNumUsers = 20, 
        maxShips = 10, 
        maxBaseVel = 100, 
        maxShipVel = 200
    };
    this.bases = []; 
    this.totalUsers = 0; 
};

/* BASE OBJECT
 * Describes the bases or planets for each user. 
 * Also contains user data like score, id, and mousePosition
 */
function Base (game, id) {
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
