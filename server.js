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

const server =
        http.createServer(app);

const io =
        new Server(server, {
            cors: {
                origin: "*"
            }
        });

let onlineUsers = 0;

/*
 * socket.id -> FCM token
 */
let userTokens = {};

io.on(
    "connection",
    (socket) => {

        console.log(
                "User Connected"
        );

        onlineUsers++;

        io.emit(
                "user_status",
                onlineUsers >= 2
                        ? "online"
                        : "offline"
        );

        socket.on(
                "register_fcm",
                (token) => {

                    if (!token) {
                        return;
                    }

                    socket.fcmToken =
                            token;

                    userTokens[
                            socket.id
                    ] = token;

                    console.log(
                            "FCM Registered"
                    );

                    console.log(
                            token
                    );

                    console.log(
                            "ALL TOKENS:",
                            userTokens
                    );
                }
        );

        socket.on(
                "send_message",
                async (message) => {

                    socket.broadcast.emit(
                            "receive_message",
                            message
                    );

                    try {

                        console.log(
                                "MESSAGE:",
                                message
                        );

                        console.log(
                                "TOKENS:",
                                userTokens
                        );

                        const senderToken =
                                socket.fcmToken;

                        for (
                                const socketId
                                in userTokens
                        ) {

                            const targetToken =
                                    userTokens[
                                            socketId
                                    ];

                            if (
                                    targetToken ===
                                    senderToken
                            ) {

                                continue;
                            }

                            const response =
                                    await admin
                                            .messaging()
                                            .send({

                                                token:
                                                        targetToken,

                                                data: {

                                                    title:
                                                            "💬 Shreya Chat",

                                                    body:
                                                            String(
                                                                    message
                                                            )
                                                },

                                                android: {

                                                    priority:
                                                            "high"
                                                }
                                            });

                            console.log(
                                    "FCM SUCCESS:",
                                    response
                            );
                        }

                    } catch (error) {

                        console.error(
                                "FCM ERROR:",
                                error
                        );
                    }
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

                    /*
                     * DO NOT DELETE TOKEN
                     * We want offline notifications.
                     */

                    console.log(
                            "User Disconnected"
                    );

                    onlineUsers--;

                    if (onlineUsers < 0) {

                        onlineUsers = 0;
                    }

                    io.emit(
                            "user_status",
                            onlineUsers >= 2
                                    ? "online"
                                    : "offline"
                    );
                }
        );
    }
);

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
