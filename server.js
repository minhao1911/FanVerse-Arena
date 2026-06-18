const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initDb, getTugScore, saveTugScore, upsertUser, getUser } = require('./db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/initial-data', (req, res) => {
  res.json({ tugScore });
});

app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    console.error('[API] GET /api/user error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/user', async (req, res) => {
  try {
    const { id, username, country, level, xp } = req.body;
    if (!id || !username) return res.status(400).json({ error: 'id and username required' });
    await upsertUser({ id, username, country, level, xp });
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] POST /api/user error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

const connectedUsers = new Map();
const tugPullTimestamps = new Map();
const TUG_RATE_LIMIT_MS = 400;
let tugScore = 50;

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.emit('tug_update', { score: tugScore });

  socket.on('tug_pull', (data) => {
    const now = Date.now();
    const last = tugPullTimestamps.get(socket.id) ?? 0;
    if (now - last < TUG_RATE_LIMIT_MS) return;
    tugPullTimestamps.set(socket.id, now);

    if (data.team === 'A') {
      tugScore = Math.min(100, tugScore + 1);
    } else if (data.team === 'B') {
      tugScore = Math.max(0, tugScore - 1);
    }
    io.emit('tug_update', { score: tugScore });
  });

  socket.on('user:join', (data) => {
    connectedUsers.set(socket.id, data);
    io.emit('presence:update', { onlineCount: connectedUsers.size });
    console.log(`[Socket] User joined: ${data.username || 'anonymous'}`);
  });

  socket.on('debate:new', (debate) => {
    socket.broadcast.emit('debate:new', debate);
    console.log(`[Socket] New debate broadcast: ${debate.title}`);
  });

  socket.on('debate:vote', (payload) => {
    socket.broadcast.emit('debate:vote', payload);
  });

  socket.on('comment:new', (comment) => {
    socket.broadcast.emit('comment:new', comment);
    console.log(`[Socket] New comment on match ${comment.matchId}`);
  });

  socket.on('comment:like', (payload) => {
    socket.broadcast.emit('comment:like', payload);
  });

  socket.on('prediction:submit', (payload) => {
    socket.broadcast.emit('prediction:submit', payload);
  });

  socket.on('group:join', (payload) => {
    socket.broadcast.emit('group:memberUpdate', payload);
  });

  socket.on('trigger_notification', (data) => {
    socket.broadcast.emit('receive_notification', data);
    console.log(`[Socket] Notification broadcast: ${data.message}`);
  });

  socket.on('send_chat_message', (data) => {
    socket.broadcast.emit('receive_chat_message', data);
    console.log(`[Chat] Room ${data.roomId} — ${data.authorName}: ${data.text}`);
  });

  socket.on('message:react', (data) => {
    socket.broadcast.emit('message:react', data);
  });

  socket.on('typing:start', (data) => {
    socket.broadcast.emit('typing:start', data);
  });

  socket.on('typing:stop', (data) => {
    socket.broadcast.emit('typing:stop', data);
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    tugPullTimestamps.delete(socket.id);
    io.emit('presence:update', { onlineCount: connectedUsers.size });
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

setInterval(async () => {
  try {
    await saveTugScore(tugScore);
  } catch (err) {
    console.error('[DB] Failed to persist tug score:', err.message);
  }
}, 5000);

const PORT = process.env.PORT || 3001;

initDb()
  .then(() => getTugScore())
  .then((saved) => {
    tugScore = saved;
    console.log(`[DB] Loaded tug score from DB: ${tugScore}`);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Express + Socket.io running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[DB] Init failed, starting with defaults:', err.message);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Running in degraded mode on port ${PORT}`);
    });
  });
