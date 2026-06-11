const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {

  console.log("User Connected");

  socket.on("send_message", (data) => {
    socket.broadcast.emit(
        "receive_message",
        data
    );
});

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });

});

app.get("/", (req, res) => {
  res.send("Shreya Chat Server Running");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
