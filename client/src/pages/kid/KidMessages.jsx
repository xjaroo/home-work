import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { listMessages, sendMessage } from '../../api/messages.js';
import { useSocket } from '../../contexts/SocketContext.jsx';

export default function KidMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const socket = useSocket();
  const kidId = user?.id;

  useEffect(() => {
    if (!kidId) return;
    listMessages(kidId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [kidId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket || !kidId) return;
    const onNew = (msg) => {
      if (msg.kid_user_id === kidId) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
    };
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [socket, kidId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim() || !kidId) return;
    const msg = await sendMessage(kidId, body.trim());
    setMessages((prev) => [...prev, msg]);
    setBody('');
  }

  if (loading) return <p className="text-gray-500 text-base">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Messages</h2>
      <div className="flex flex-col card-app min-h-[300px] overflow-hidden">
        <ul className="flex-1 overflow-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`p-3 rounded-app max-w-[85%] ${m.sender_user_id === user?.id ? 'ml-auto mr-0 bg-indigo-100' : 'ml-0 mr-auto bg-gray-100'}`}
            >
              {m.sender_user_id !== user?.id && m.senderUserName && <p className="text-xs font-medium text-gray-600">From {m.senderUserName}</p>}
              <p className="text-sm text-gray-800">{m.body}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(m.created_at).toLocaleString()}</p>
            </li>
          ))}
          <li ref={bottomRef} />
        </ul>
        <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            className="input-app flex-1 py-2.5"
          />
          <button type="submit" className="btn-app-primary">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
