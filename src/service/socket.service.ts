import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket;
  private currentUserId: string | null = null;

  constructor() {
    this.socket = io(
      (process.env.REACT_APP_SOCKET_SERVER as string) ||
        (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api/1.0', '') : 'https://alter-buddy-api-ih2y.onrender.com'),
      {
        autoConnect: false,
        transports: ['websocket', 'polling'],
      }
    );

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id);
      // Re-register user if we have a current user
      if (this.currentUserId) {
        this.registerUser(this.currentUserId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
    });
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
    this.currentUserId = null;
  }

  registerUser(userId: string) {
    this.currentUserId = userId;
    if (this.socket.connected) {
      console.log('🔌 Registering user:', userId);
      this.socket.emit('registerUser', { userId });
    } else {
      // Connect first, then register
      this.connect();
    }
  }

  registerMentor(mentorId: string) {
    if (this.socket.connected) {
      console.log('🔌 Registering mentor:', mentorId);
      this.socket.emit('registerMentor', { mentorId });
    } else {
      this.connect();
      this.socket.on('connect', () => {
        this.socket.emit('registerMentor', { mentorId });
      });
    }
  }

  updateUserStatus(userId: string, online: boolean) {
    if (this.socket.connected) {
      this.socket.emit('updateUserStatus', { userId, online });
    }
  }

  // Get the raw socket for other components that need direct access
  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket.connected;
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Export the raw socket for backward compatibility
export const socket = socketService.getSocket();
