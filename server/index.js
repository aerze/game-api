const http = require("http");
const socketio = require("socket.io");
const morgan = require("morgan");
const express = require("express");
const bodyParser = require("body-parser");

const socketHandler = require("./main");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PATH_TO_CLIENT_BUILD = path.resolve(path.join(__dirname, "../../mobile-mayhem-client/dist/"));
console.log(PATH_TO_CLIENT_BUILD);

io.on("connection", socketHandler);

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use("/", express.static(PATH_TO_CLIENT_BUILD));
// app.get("/", (req, res) => {
//   return res.json(new Date());
// });

server.listen(8080, () => {
  console.log("ready for requests", "http://localhost:8080");
});
