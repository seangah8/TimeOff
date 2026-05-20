import { createServer } from 'http';
import { Server } from 'socket.io';
import { verify } from 'jsonwebtoken';

let io: Server | null = null;

function parseCookies(header: string): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((c) => {
      const [key, ...val] = c.trim().split('=');
      return [key.trim(), decodeURIComponent(val.join('='))];
    }),
  );
}

export function initSocket(httpServer: ReturnType<typeof createServer>): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie ?? '');
    const token = cookies['access_token'];
    if (!token) return next(new Error('Unauthorized'));

    try {
      const payload = verify(token, process.env.JWT_SECRET ?? 'secret') as {
        userId: number;
        role: string;
      };
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Each user gets a personal room for targeted notifications.
    socket.join(`user:${socket.data.userId}`);
    // Validators also join a shared room so new requests broadcast to all of them.
    if (socket.data.role === 'Validator') {
      socket.join('role:Validator');
    }
  });

  return io;
}

// Returns null when called outside of a running server (e.g. in tests),
// so callers can safely use optional chaining: getIO()?.to(...).
export function getIO(): Server | null {
  return io;
}
