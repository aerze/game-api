const path = require("path");
const http = require("http");
const Socketio = require("socket.io");
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const handleSocketConnection = require("./main");

const app = express();
const server = http.createServer(app);
const io = new Socketio.Server(server);

const PATH_TO_CLIENT_BUILD = path.resolve(path.join(__dirname, "../../mobile-mayhem-client/dist/"));
console.log(PATH_TO_CLIENT_BUILD);

io.on("connection", handleSocketConnection);

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use("/", express.static(PATH_TO_CLIENT_BUILD));
// app.get("/", (req, res) => {
//   return res.json(new Date());
// });

server.listen(8080, () => {
  console.log("ready for requests", "http://localhost:8080");
});
