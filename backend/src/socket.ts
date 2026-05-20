import { createServer } from 'http';
import { Server } from 'socket.io';
import { verify } from 'jsonwebtoken';

// Stored at module level so getIO() can return it from anywhere in the app.
let io: Server | null = null;

// Socket.io does not expose req.cookies like Express does, so we parse the
// raw Cookie header string ourselves into a plain key/value object.
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

  // Authenticate every socket connection using the same JWT cookie the REST API uses.
  // Connections without a valid token are rejected before they can join any room.
  io.use((socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie ?? '');
    const token = cookies['access_token'];
    if (!token) return next(new Error('Unauthorized'));

    try {
      const payload = verify(token, process.env.JWT_SECRET ?? 'secret') as {
        userId: number;
        role: string;
      };
      // Attach identity to the socket so room logic below can use it.
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Each user gets a personal room for targeted notifications (e.g. "your request was approved").
    socket.join(`user:${socket.data.userId}`);
    // Validators also join a shared broadcast room so all of them receive new request alerts.
    if (socket.data.role === 'Validator') {
      socket.join('role:Validator');
    }
  });

  return io;
}

// Returns null when called outside of a running server (e.g. in tests),
// so callers can safely use optional chaining: getIO()?.to(...).emit(...)
export function getIO(): Server | null {
  return io;
}
