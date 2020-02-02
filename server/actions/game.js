const Game = require("../models/game");
const Player = require("../models/player");

const GamesIdMap = new Map();

/**
 * Creates a new game
 * @param {string} name
 * @param {SocketIO.Socket} socket
 */
function createGame(name, socket) {
  console.log(`actions/game:createGame(name: ${name}, socket: ${socket.id})`);
  const game = new Game(name, socket);
  GamesIdMap.set(game.id, game);
  return game;
}

/**
 * Find existing game by gameId
 * @param {string} gameId
 */
function findGameById(gameId) {
  console.log(`actions/game:findGameById(gameId: ${gameId})`);
  const game = GamesIdMap.get(gameId);
  return game;
}

/**
 * Assigns player as host of given game
 * @param {Game} game
 * @param {Player} player
 */
function setPlayerAsHost(game, player) {
  console.log(`actions/game:setPlayerAsHost(game: ${game.id}, player: ${player.id})`);
  game.host = player;
}

/**
 * Adds player to given game and room
 * @param {Game} game
 * @param {Player} player
 */
function addPlayerToGame(game, player) {
  console.log(`actions/game:addPlayerToGame(game: ${game.id}, player: ${player.id})`);
  player.socket.join(game.id);
  game.players.push(player);
}

/**
 * Fins player within a game
 * @param {Game} game
 * @param {string} playerId
 */
function findPlayerInGame(game, playerId) {
  console.log(`actions/game:findPlayerInGame(game: ${game.id}, playerId: ${playerId})`);
  return game.players.find(p => p.id === playerId);
}

/**
 * Adds score to player
 * @param {Player} player
 * @param {number} score
 */
function addPlayerScore(player, score) {
  console.log(`actions/game:addPlayerScore(player: ${player.id}, score: ${score})`);
  player.score += score;
}

/**
 * Sets player as ready and updates allReady in game
 * @param {Player} player
 */
function setPlayerAsReady(player) {
  console.log(`actions/game:setPlayerAsReady(player: ${player.id})`);
  player.ready = true;
}

/**
 * Sets all players all ready
 * @param {Game} game
 */
function setAllPlayersUnready(game) {
  console.log(`actions/game:setAllPlayersUnready(game: ${game.id})`);
  game.players.forEach(p => (p.ready = false));
}

/**
 * Return true if player is current game host
 * @param {Game} game
 * @param {Player} player
 */
function playerIsHost(game, player) {
  console.log(`actions/game:playerIsHost(game: ${game.id}, player: ${player.id})`);
  return game.host.id === player.id;
}

/**
 * Sets current game state
 * @param {Game} game
 * @param {'LOBBY' | 'SCORE' | 'GAME' | 'RESULTS'} state
 */
function pushRoomToState(game, state) {
  console.log(`actions/game:pushRoomToState(game: ${game.id}, state: ${state})`);
  game.state = state;
}

/**
 * Checks if all players are ready
 * @param {Game} game
 */
function checkPlayersReady(game) {
  console.log(`actions/game:checkPlayersReady(game: ${game.id})`);
  const allReady = game.players.every(p => p.ready);
  console.log(`\t allReady: ${allReady}`);
  if (allReady) game.ready.emit("ALL_READY");
  return allReady;
}

/**
 * Checks if all players are ready
 * @param {Game} game
 * @param {number} timeout
 */
function allPlayersReady(game, timeout) {
  console.log(`actions/game:allPlayersReady(game: ${game.id}, timeout: ${timeout})`);
  return new Promise((resolve, reject) => {
    const r = () => {
      console.log("\t ALL PLAYERS READY");
      resolve();
    };
    game.ready.once("ALL_READY", r);
    setTimeout(() => {
      console.log(`\t TIMEOUT: ${timeout}`);
      game.ready.removeListener("ALL_READY", r);
      resolve();
    }, timeout);
  });
}

/**
 * Checks if game has a winner
 * @param {Game} game
 */
function hasWinner(game) {
  console.log(`actions/game:hasWinner(game: ${game.id})`);
  return !game.players.every(p => p.score < 10);
}

/**
 * Pushes the current game state to room
 * @param {Game} game
 */
function messageRoom(game) {
  console.log(`actions/game:messageRoom(game: ${game.id})`);
  game.room.emit("update", { game });
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
  messageRoom
};
