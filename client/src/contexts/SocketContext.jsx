import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) {
      if (ref.current) {
        ref.current.disconnect();
        ref.current = null;
        setSocket(null);
      }
      return;
    }
    const s = io(window.location.origin, { withCredentials: true });
    ref.current = s;
    s.on('connect', () => setSocket(s));
    return () => {
      s.disconnect();
      ref.current = null;
      setSocket(null);
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
