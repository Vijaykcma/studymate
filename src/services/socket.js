import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    let token = null;
    try {
      token = localStorage.getItem('studymate_token');
    } catch {}

    socket = io(window.location.origin, {
      auth: { token },
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected to server:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket.io] Connection warning:', error.message);
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
