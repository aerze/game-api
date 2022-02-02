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
function handleCreateGame(socket, { lobbyName, playerName }) {
  console.group("\ncreating game");
  // console.log(`args lobbyName: ${lobbyName} playerName: ${playerName}`);

  const player = PlayerActions.createPlayer(playerName, socket);
  const game = GameActions.createGame(lobbyName, socket);
  GameActions.setPlayerAsHost(game, player);
  GameActions.addPlayerToGame(game, player);

  GameActions.messagePlayer(player, "GAME_CREATED", { game, player });
  console.groupEnd();
}

/**
 * Creates player, finds game, add player to game
 * @param {SocketIO.Socket} socket
 * @param {{ gameId: string, playerName: string }} data
 * @param {function} ack
 */
function handleJoinGame(socket, { gameId, playerName }) {
  console.group(`\njoining game`);
  // console.log(`args gameId: ${gameId} playerName: ${playerName}`);

  const player = PlayerActions.createPlayer(playerName, socket);
  const game = GameActions.findGameById(gameId);
  if (!game) throw Error("GAME NOT FOUND");
  GameActions.addPlayerToGame(game, player);
  GameActions.messageRoom(game, "PLAYER_JOINED", { game });
  GameActions.messagePlayer(player, "GAME_JOINED", { player });
  console.groupEnd();
}

/**
 * Sets player's status to ready
 * @param {{ gameId: string, playerId: string }} data
 * @param {function} ack
 */
function handlePlayerReady({ gameId, playerId }, ack) {
  // console.group(`\nsetting player to ready`);
  // console.log(`args gameId: ${gameId} playerId: ${playerId}`);
  const game = GameActions.findGameById(gameId);
  const player = GameActions.findPlayerInGame(game, playerId);
  GameActions.setPlayerAsReady(player);
  GameActions.checkPlayersReady(game);
  GameActions.messageRoom(game, "PLAYER_IS_READY", { game });
  // console.groupEnd();
}

/**
 * Sets player's status to ready
 * @param {{ gameId: string, playerId: string, score: number }} data
 * @param {function} ack
 */
function handlePlayerScore({ gameId, playerId, score }, ack) {
  // console.log(
  //   `main:handlePlayerScore({gameId: ${gameId}, playerId: ${playerId}, score: ${score}})`
  // );
  const game = GameActions.findGameById(gameId);
  const player = GameActions.findPlayerInGame(game, playerId);
  GameActions.addPlayerScore(player, score);
  GameActions.setPlayerAsReady(player);
  GameActions.checkPlayersReady(game);
  GameActions.messageRoom(game, "SET_PLAYER_SCORE");
}

/**
 * Kicks off game loop
 * @param {{ gameId: string}} data
 * @param {function} ack
 */
function handleStartGame({ gameId, playerId }) {
  console.group(`\nstarting game`);
  // console.log(`args gameId: ${gameId} playerId: ${playerId}`);
  const game = GameActions.findGameById(gameId);
  const player = GameActions.findPlayerInGame(game, playerId);

  console.groupEnd();
  if (GameActions.playerIsHost(game, player)) {
    loop(game);
  }
}

/**
 * Main game loop
 * @param {Game} game
 */
async function loop(game) {
  console.group(`\n${game.displayName} loop start`);
  GameActions.pushRoomToState(game, "SCORE");
  GameActions.setAllPlayersUnready(game);
  GameActions.messageRoom(game, "MOVE_TO_SCOREBOARD", { game });

  const SCORE_TIMEOUT = 5 * 60 * 1000;
  await GameActions.allPlayersReady(game, SCORE_TIMEOUT);
  console.log(`starting mini game in ${game.displayName}`);

  GameActions.pushRoomToState(game, "MINI_GAME");
  GameActions.setAllPlayersUnready(game);
  GameActions.messageRoom(game, "MOVE_TO_GAME", { game });

  const GAME_TIMEOUT = 5 * 60 * 1000;
  await GameActions.allPlayersReady(game, GAME_TIMEOUT);
  console.log(`ending mini game in ${game.displayName}`);

  if (GameActions.hasWinner(game)) {
    console.log(`${game.displayName} has a winner`);
    GameActions.pushRoomToState(game, "RESULTS");
    GameActions.messageRoom(game, "MOVE_TO_RESULTS", { game });
    const winners = game.players.filter((p) => p.score >= 10).map((p) => p.displayName);
    const multipleWinners = winners.length > 1;
    console.log(`The winner${multipleWinners ? "s are" : " is"} ${winners.join(" and ")}`);

    console.groupEnd();
    return;
  }

  console.log(`main:loop(Game: ${game.id}) // no winner`);
  console.groupEnd();
  return loop(game);
}

/**
 * Handles initial socket connection
 * @param {SocketIO.Socket} socket
 */
function handleSocketConnection(socket) {
  console.log(`socket connection established: ${socket.id}`);

  socket.on(CLIENT.CREATE_GAME, (data, ack) => handleCreateGame(socket, data, ack));

  socket.on(CLIENT.JOIN_GAME, (data, ack) => handleJoinGame(socket, data, ack));

  socket.on(CLIENT.PLAYER_READY, handlePlayerReady);

  socket.on(CLIENT.PLAYER_SCORE, handlePlayerScore);

  socket.on(CLIENT.START_GAME, handleStartGame);
}

module.exports = handleSocketConnection;
