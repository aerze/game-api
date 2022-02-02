const shortId = require("shortid");

class Player {
  /**
   * @param {string} name
   * @param {SocketIO.Socket} socket
   */
  constructor(name, socket) {
    this.id = shortId.generate();
    this.name = name;
    this.displayName = `👩‍💻${this.name}`;
    this.ready = false;
    this.score = 0;
    this.socket = socket;
    // console.log(`created new player (${this.id})`);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      ready: this.ready,
      score: this.score
    };
  }
}

module.exports = Player;
