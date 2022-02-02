const Game = require("../models/game");
const Player = require("../models/player");

const GamesIdMap = new Map();

/**
 * Creates a new game
 * @param {string} name
 * @param {SocketIO.Socket} socket
 */
function createGame(name, socket) {
  // console.group(`creating game named ${name} with socket ${socket.id}`);
  const game = new Game(name, socket);
  GamesIdMap.set(game.id, game);
  // console.groupEnd();
  console.log(`created new game ${game.displayName} (${game.id})`);
  return game;
}

/**
 * Find existing game by gameId
 * @param {string} gameId
 */
function findGameById(gameId) {
  // console.log(`looking for game with id (${gameId})`);
  const game = GamesIdMap.get(gameId);
  return game;
}

/**
 * Assigns player as host of given game
 * @param {Game} game
 * @param {Player} player
 */
function setPlayerAsHost(game, player) {
  game.host = player;
  console.log(`set ${player.displayName} as host of ${game.displayName}`);
}

/**
 * Adds player to given game and room
 * @param {Game} game
 * @param {Player} player
 */
function addPlayerToGame(game, player) {
  player.socket.join(game.id);
  game.players.push(player);
  console.log(`added ${player.displayName} to ${game.displayName}`);
}

/**
 * Fins player within a game
 * @param {Game} game
 * @param {string} playerId
 */
function findPlayerInGame(game, playerId) {
  // console.log(`looking for player with id (${playerId}) in ${game.displayName}`);
  return game.players.find((p) => p.id === playerId);
}

/**
 * Adds score to player
 * @param {Player} player
 * @param {number} score
 */
function addPlayerScore(player, score) {
  player.score += score;
  console.log(`set ${player.displayName}'s score to ${player.score}`);
}

/**
 * Sets player as ready and updates allReady in game
 * @param {Player} player
 */
function setPlayerAsReady(player) {
  console.log(`${player.displayName} is ready`);
  player.ready = true;
}

/**
 * Sets all players all ready
 * @param {Game} game
 */
function setAllPlayersUnready(game) {
  game.players.forEach((p) => (p.ready = false));
  console.log(`reset players in ${game.displayName}`);
}

/**
 * Return true if player is current game host
 * @param {Game} game
 * @param {Player} player
 */
function playerIsHost(game, player) {
  console.log(`checking if ${player.displayName} is host for ${game.displayName}`);
  return game.host.id === player.id;
}

/**
 * Sets current game state
 * @param {Game} game
 * @param {'LOBBY' | 'SCORE' | 'MINI_GAME' | 'RESULTS'} state
 */
function pushRoomToState(game, state) {
  game.state = state;
  console.log(`\nmoved ${game.displayName} to ${state}`);
}

/**
 * Checks if all players are ready
 * @param {Game} game
 */
function checkPlayersReady(game) {
  // console.log(`checking readiness of all players in ${game.displayName}`);
  const allReady = game.players.every((p) => p.ready);
  if (allReady) game.ready.emit("ALL_READY");
  return allReady;
}

/**
 * Checks if all players are ready,
 * returns promise if event came through or after timeout
 * @param {Game} game
 * @param {number} timeout
 */
function allPlayersReady(game, timeout) {
  console.log(`waiting ${timeout / 60000} minutes for players to ready-up`);

  // create a new promise
  return new Promise((resolve, reject) => {
    // create reference to event handler
    const r = () => {
      console.log(`\t all players are ready`);
      resolve();
    };

    // start listening for an "ALL_READY" event
    game.ready.once("ALL_READY", r);

    // start the timeout also
    setTimeout(() => {
      console.log(`\t time limit reached, not all players were ready`);
      // remove the event listener, since we didn't get it in time
      game.ready.off("ALL_READY", r);
      resolve();
    }, timeout);
  });
}

/**
 * Checks if game has a winner
 * @param {Game} game
 */
function hasWinner(game) {
  console.log(`game ${game.displayName} finished`);
  return !game.players.every((p) => p.score < 10);
}

/**
 * Pushes the current game state to room
 * @param {Game} game
 * @param {string} event
 * @param {Object} data
 */
function messageRoom(game, event, data) {
  console.log(`\t\t\tsending ${event} event to ${game.displayName}`);
  game.room.emit(event, data);
}

/**
 * send message directly to a player
 * @param {Player} player
 * @param {string} event
 * @param {Object} data
 */
function messagePlayer(player, event, data) {
  console.log(`\t\t\tsending ${event} event to ${player.displayName}`);
  player.socket.emit(event, data);
}

module.exports = {
  createGame,
  findGameById,
  setPlayerAsHost,
  addPlayerToGame,
  findPlayerInGame,
  addPlayerScore,
  setPlayerAsReady,
  setAllPlayersUnready,
  checkPlayersReady,
  allPlayersReady,
  playerIsHost,
  pushRoomToState,
  hasWinner,
  messageRoom,
  messagePlayer
};
