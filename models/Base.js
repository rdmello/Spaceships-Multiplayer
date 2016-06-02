var Ship = require('./Ship.js');  
var utils = require('./utils.js'); 

/* BASE OBJECT
 * Describes the bases or planets for each user. 
 * Also contains user data like score, id, and mousePosition
 */
function Base (game, socket, id) {
    this.id = typeof id === 'undefined' ? utils.generate_GUID() : id; 
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
        this.removalQueue = []; 
    }, 

    pack: function () {
        return JSON.stringify({data: this, type: 'setup'}); 
    }
}; 

module.exports = Base; 
