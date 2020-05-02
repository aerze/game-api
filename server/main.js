const Game = require("./models/game");
const GameActions = require("./actions/game");
const PlayerActions = require("./actions/player");

const CLIENT = {
  CREATE_GAME: "CREATE_GAME",
  JOIN_GAME: "JOIN_GAME",
  PLAYER_READY: "PLAYER_READY",
  PLAYER_SCORE: "PLAYER_SCORE",
  START_GAME: "START_GAME"
};

/**
 * Creates a player and game
 * @param {SocketIO.Socket} socket
 * @param {{ lobbyName: string, playerName: string }} data
 * @param {function} ack
 */
function handleCreateGame(socket, { lobbyName, playerName }, ack) {
  console.log(
    `main:handleCreateGame(Socket: ${socket.id}, { lobbyName: ${lobbyName}, playerName: ${playerName}})`
  );

  const player = PlayerActions.createPlayer(playerName, socket);
  const game = GameActions.createGame(lobbyName, socket);
  GameActions.setPlayerAsHost(game, player);
  GameActions.addPlayerToGame(game, player);

  GameActions.messagePlayer(player, "GAME_CREATED", { game, player });
}

/**
 * Creates player, finds game, add player to game
 * @param {SocketIO.Socket} socket
 * @param {{ gameId: string, playerName: string }} data
 * @param {function} ack
 */
function handleJoinGame(socket, { gameId, playerName }, ack) {
  console.log(
    `main:handleJoinGame(Socket: ${socket.id}, {gameId: ${gameId}, playerName: ${playerName}})`
  );

  const player = PlayerActions.createPlayer(playerName, socket);
  const game = GameActions.findGameById(gameId);
  GameActions.addPlayerToGame(game, player);
  GameActions.messageRoom(game, "PLAYER_JOINED", { game });
  GameActions.messagePlayer(player, "GAME_JOINED", { player });
}

/**
 * Sets player's status to ready
 * @param {{ gameId: string, playerId: string }} data
 * @param {function} ack
 */
function handlePlayerReady({ gameId, playerId }, ack) {
  console.log(`main:handlePlayerReady({gameId: ${gameId}, playerId: ${playerId}})`);
  const game = GameActions.findGameById(gameId);
  const player = GameActions.findPlayerInGame(game, playerId);
  GameActions.setPlayerAsReady(player);
  GameActions.messageRoom(game, "PLAYER_IS_READY", { game });
}

/**
 * Sets player's status to ready
 * @param {{ gameId: string, playerId: string, score: number }} data
 * @param {function} ack
 */
function handlePlayerScore({ gameId, playerId, score }, ack) {
  console.log(
    `main:handlePlayerScore({gameId: ${gameId}, playerId: ${playerId}, score: ${score}})`
  );
  const game = GameActions.findGameById(gameId);
  const player = GameActions.findPlayerInGame(game, playerId);
  GameActions.addPlayerScore(player, score);
  GameActions.setPlayerAsReady(player);
  GameActions.messageRoom(game, "SET_PLAYER_SCORE");
}

/**
 * Kicks off game loop
 * @param {{ gameId: string}} data
 * @param {function} ack
 */
function handleStartGame({ gameId, playerId }) {
  console.log(`main:handleStartGame({gameId: ${gameId}, playerId: ${playerId}})`);
  const game = GameActions.findGameById(gameId);
  const player = GameActions.findPlayerInGame(game, playerId);

  if (GameActions.playerIsHost(game, player)) {
    loop(game);
  }
}

/**
 * Main game loop
 * @param {Game} game
 */
async function loop(game) {
  console.log(`main:loop(Game: ${game.id})`);
  GameActions.pushRoomToState(game, "SCORE");
  GameActions.setAllPlayersUnready(game);
  GameActions.messageRoom(game, "MOVE_TO_SCOREBOARD", { game });
  console.log(`main:loop(Game: ${game.id}) // pushed to SCORE, starting timeout`);

  await GameActions.allPlayersReady(game, 5 * 1000);
  console.log(`main:loop(Game: ${game.id}) // all players ready`);

  GameActions.pushRoomToState(game, "GAME");
  GameActions.setAllPlayersUnready(game);
  GameActions.messageRoom(game, "MOVE_TO_GAME", { game });
  console.log(`main:loop(Game: ${game.id}) // pushed to GAME, waiting for scores`);

  await GameActions.allPlayersReady(game, 30 * 1000);
  console.log(`main:loop(Game: ${game.id}) // all players scores in`);

  if (GameActions.hasWinner(game)) {
    console.log(`main:loop(Game: ${game.id}) // has winner`);

    GameActions.pushRoomToState(game, "RESULTS");
    GameActions.messageRoom(game, "MOVE_TO_RESULTS", { game });
    console.log(`main:loop(Game: ${game.id}) // pushed to results`);
    return;
  }

  console.log(`main:loop(Game: ${game.id}) // no winner`);
  return loop(game);
}

/**
 * Handles initial socket connection
 * @param {SocketIO.Socket} socket
 */
function handleSocketConnection(socket) {
  console.log(`main:handleSocketConnection(Socket: ${socket.id})`);

  socket.on(CLIENT.CREATE_GAME, (data, ack) => handleCreateGame(socket, data, ack));

  socket.on(CLIENT.JOIN_GAME, (data, ack) => handleJoinGame(socket, data, ack));

  socket.on(CLIENT.PLAYER_READY, handlePlayerReady);

  socket.on(CLIENT.PLAYER_SCORE, handlePlayerScore);

  socket.on(CLIENT.START_GAME, handleStartGame);
}

module.exports = handleSocketConnection;
