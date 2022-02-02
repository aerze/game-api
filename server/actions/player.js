const Player = require("../models/player");
// const Game = require("../models/game");

/**
 * Creates a new player
 * @param {string} name
 * @param {SocketIO.Socket} socket
 */
function createPlayer(name, socket) {
  // console.group(`creating player named ${name} with socket ${socket.id}`);
  const player = new Player(name, socket);
  // console.groupEnd();
  console.log(`created new player ${player.displayName} (${player.id})`);
  return player;
}

module.exports = {
  createPlayer
};
