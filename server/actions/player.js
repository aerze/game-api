const Player = require("../models/player");
// const Game = require("../models/game");

/**
 * Creates a new player
 * @param {string} name
 * @param {SocketIO.Socket} socket
 */
function createPlayer(name, socket) {
  console.log(`actions/player:createPlayer(name: ${name}, socket: ${socket.id})`);
  return new Player(name, socket);
}

module.exports = {
  createPlayer
};
