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

let onlineUsers = 0;

io.on("connection", (socket) => {

  console.log("User Connected");

  onlineUsers++;

  io.emit("user_status", {
    online: true,
    count: onlineUsers
  });

  socket.on("send_message", (data) => {

    socket.broadcast.emit(
      "receive_message",
      data
    );

  });

  socket.on("typing", () => {

    socket.broadcast.emit(
      "typing"
    );

  });

  socket.on("message_delivered", () => {

    socket.broadcast.emit(
      "message_delivered"
    );

  });

  socket.on("message_seen", () => {

    socket.broadcast.emit(
      "message_seen"
    );

  });

  socket.on("disconnect", () => {

    console.log("User Disconnected");

    onlineUsers--;

    io.emit("user_status", {
      online: onlineUsers > 0,
      count: onlineUsers
    });

  });

});

app.get("/", (req, res) => {

  res.send(
    "Shreya Chat Server Running"
  );

});

const PORT =
  process.env.PORT || 3000;

server.listen(PORT, () => {

  console.log(
    "Server running on port " + PORT
  );

});
