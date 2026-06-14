const admin = require("firebase-admin");

const serviceAccount =
require("/etc/secrets/firebase-service-account.json");

admin.initializeApp({
    credential:
        admin.credential.cert(
            serviceAccount
        )
});

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

    if (onlineUsers >= 2) {

        io.emit(
            "user_status",
            "online"
        );

    } else {

        io.emit(
            "user_status",
            "offline"
        );
    }

    socket.on(
        "send_message",
        (data) => {

            socket.broadcast.emit(
                "receive_message",
                data
            );
        }
    );

    socket.on(
        "send_media",
        (data) => {

            socket.broadcast.emit(
                "receive_media",
                data
            );
        }
    );

    socket.on(
        "typing",
        (username) => {

            socket.broadcast.emit(
                "typing",
                username
            );
        }
    );

    socket.on(
        "message_delivered",
        () => {

            socket.broadcast.emit(
                "message_delivered"
            );
        }
    );

    socket.on(
        "message_seen",
        () => {

            socket.broadcast.emit(
                "message_seen"
            );
        }
    );

    socket.on(
        "disconnect",
        () => {

            console.log(
                "User Disconnected"
            );

            onlineUsers--;

            if (onlineUsers < 0) {

                onlineUsers = 0;
            }

            if (onlineUsers >= 2) {

                io.emit(
                    "user_status",
                    "online"
                );

            } else {

                io.emit(
                    "user_status",
                    "offline"
                );
            }
        }
    );
});

app.get(
    "/",
    (req, res) => {

        res.send(
            "Shreya Chat Server Running"
        );
    }
);

const PORT =
    process.env.PORT || 3000;

server.listen(
    PORT,
    () => {

        console.log(
            "Server running on port " +
            PORT
        );
    }
);
