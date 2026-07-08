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
 * username -> token
 */
const userTokens = {};

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
                (data) => {

                    try {

                        const user =
                                JSON.parse(
                                        data
                                );

                        const username =
                                user.username;

                        const token =
                                user.token;

                        if (
                                !username ||
                                !token
                        ) {

                            return;
                        }

                        userTokens[
                                username
                        ] = token;

                        socket.username =
                                username;

                        console.log(
                                "FCM Registered:"
                        );

                        console.log(
                                username
                        );

                    } catch (e) {

                        console.error(
                                "REGISTER ERROR:",
                                e
                        );
                    }
                }
        );

        socket.on(
                "send_message",
                async (data) => {

                    try {

                        const messageData =
                                JSON.parse(
                                        data
                                );

                        const sender =
                                messageData.username;

                        const message =
                                messageData.message;

                        socket.broadcast.emit(
                                "receive_message",
                                message
                        );

                        for (
                                const username
                                in userTokens
                        ) {

                            if (
                                    username ===
                                    sender
                            ) {

                                continue;
                            }

                            const token =
                                    userTokens[
                                            username
                                    ];

                            try {

                                const response =
                                        await admin
                                                .messaging()
                                                .send({

                                                    token:
                                                            token,

                                                    notification: {

                                                        title:
                                                                sender,

                                                        body:
                                                                message
                                                    },

                                                    android: {

                                                        priority:
                                                                "high",

                                                        notification: {

                                                            channelId:
                                                                    "shreya_chat",

                                                            defaultSound:
                                                                    true
                                                        }
                                                    }
                                                });

                                console.log(
                                        "FCM SUCCESS:",
                                        response
                                );

                            } catch (err) {

                                console.error(
                                        "FCM SEND ERROR:",
                                        err
                                );
                            }
                        }

                    } catch (e) {

                        console.error(
                                "MESSAGE ERROR:",
                                e
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

                    console.log(
                            "User Disconnected"
                    );

                    onlineUsers--;

                    if (
                            onlineUsers < 0
                    ) {

                        onlineUsers = 0;
                    }

                    io.emit(
                            "user_status",
                            onlineUsers >= 2
                                    ? "online"
                                    : "offline"
                    );

                    /*
                     * Keep token.
                     * Do NOT delete.
                     */
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
