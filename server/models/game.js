const EventEmitter = require("events");
const shortId = require("shortid");
const Player = require("../models/player");

class Game {
  /**
   * @param {string} name
   * @param {SocketIO.Socket} socket
   */
  constructor(name, socket) {
    this.id = shortId.generate();

    this.name = name;

    this.displayName = `🕹 ${this.name}`;

    /** @type {Player} */
    this.host = null;

    /** @type {Player[]} */
    this.players = [];

    /** @type {'LOBBY' | 'SCORE' | 'GAME' | 'RESULTS'} */
    this.state = "LOBBY";

    /** @type {'ACCURACY' | 'RANDOM' | 'SPEED'} */
    this.micro = "SPEED";

    this.room = socket.server.to(this.id);

    this.ready = new EventEmitter();

    // console.log(`created new game (${this.id})`);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      hostId: this.host.id,
      players: this.players,
      state: this.state,
      micro: this.micro
    };
  }
}

module.exports = Game;
