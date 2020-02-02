const http = require("http");
const socketio = require("socket.io");
const morgan = require("morgan");
const express = require("express");
const bodyParser = require("body-parser");

const socketHandler = require("./main");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on("connection", socketHandler);

app.use(morgan("dev"));
app.use(bodyParser.json());
app.get("/", (req, res) => {
  return res.json(new Date());
});

server.listen(8080, () => {
  console.log("ready for requests");
});
