// Rylan Dmello
// 4 June 2016
// Making Bots for more map coverage in-game

function Bot (game) {
    this.posX = Math.floor(game.gameSettings.mapWidth *Math.random()); 
    this.posY = Math.floor(game.gameSettings.mapHeight*Math.random()); 
    this.size = 40*(Math.random()+1); 
    this.velX = 40*(Math.random()- 0.5); 
    this.velY = 40*(Math.random()- 0.5); 
    this.damage = 2*((2*(Math.round(Math.random())))-1)*this.size; 
}

module.exports = Bot; 
