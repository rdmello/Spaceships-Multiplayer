var utils = require('./utils.js'); 

/* SHIP OBJECT
 * Summarizes the spaceship properties. Does not need
 * an ID.
 */
function Ship (base) {
    this.id = utils.generate_GUID(); 
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

// Polyfill for Math.sign from 
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
Math.sign = Math.sign || function(x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
        return x;
    }
    return x > 0 ? 1 : -1;
}

module.exports = Ship; 
