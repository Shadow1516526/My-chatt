const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Раздаем файлы из папки public
app.use(express.static('public'));

// Отправляем главную страницу
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const users = new Map();

io.on('connection', (socket) => {
    console.log('Новый пользователь:', socket.id);

    socket.on('user_join', (username) => {
        users.set(socket.id, username);
        socket.broadcast.emit('user_joined', username);
        socket.emit('online_users', Array.from(users.values()));
    });

    socket.on('new_message', (data) => {
        const username = users.get(socket.id);
        const messageData = {
            username: username,
            message: data.message,
            timestamp: new Date().toLocaleTimeString()
        };
        io.emit('new_message', messageData);
    });

    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            users.delete(socket.id);
            socket.broadcast.emit('user_left', username);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
