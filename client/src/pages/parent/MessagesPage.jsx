import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getFamilyMembers } from '../../api/families.js';
import { listParentChat, sendParentChatMessage, deleteParentChatMessage } from '../../api/messages.js';
import { useSocket } from '../../contexts/SocketContext.jsx';

export default function MessagesPage() {
  const { user } = useAuth();
  const canRemoveMessages = user?.role === 'parent';
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [mentionPicker, setMentionPicker] = useState({ show: false, start: 0, query: '' });
  const [mentionHighlight, setMentionHighlight] = useState(-1);
  const [removingId, setRemovingId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);
  const socket = useSocket();

  useEffect(() => {
    getFamilyMembers()
      .then((r) => setMembers(r.members || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    listParentChat()
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => {
      const id = String(msg?.id ?? '');
      setMessages((prev) =>
        !id || prev.some((m) => String(m.id) === id) ? prev : [...prev, msg]
      );
    };
    const onDeleted = ({ id: messageId }) => {
      const mid = String(messageId ?? '');
      setMessages((prev) => prev.filter((m) => String(m.id) !== mid));
    };
    socket.on('parent_chat:new', onNew);
    socket.on('parent_chat:deleted', onDeleted);
    return () => {
      socket.off('parent_chat:new', onNew);
      socket.off('parent_chat:deleted', onDeleted);
    };
  }, [socket]);

  const filteredMentionMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionPicker.query.toLowerCase())
  );

  const handleInputChange = useCallback(
    (e) => {
      const v = e.target.value;
      const pos = e.target.selectionStart ?? v.length;
      setBody(v);
      const before = v.slice(0, pos);
      const lastAt = before.lastIndexOf('@');
      if (lastAt >= 0) {
        const afterAt = before.slice(lastAt + 1);
        if (!/\s/.test(afterAt)) {
          setMentionPicker({ show: true, start: lastAt, query: afterAt });
          setMentionHighlight(0);
          return;
        }
      }
      setMentionPicker((prev) => (prev.show ? { ...prev, show: false } : prev));
    },
    []
  );

  const insertMention = useCallback(
    (member) => {
      const start = mentionPicker.start;
      const end = inputRef.current ? inputRef.current.selectionStart : body.length;
      const inserted = `@${member.name} `;
      const newBody = body.slice(0, start) + inserted + body.slice(end);
      setBody(newBody);
      setMentionPicker({ show: false, start: 0, query: '' });
      setMentionHighlight(-1);
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const newPos = start + inserted.length;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newPos, newPos);
        }
      });
    },
    [body, mentionPicker.start]
  );

  const handleInputKeyDown = useCallback(
    (e) => {
      if (!mentionPicker.show) return;
      if (e.key === 'Escape') {
        setMentionPicker((prev) => ({ ...prev, show: false }));
        setMentionHighlight(-1);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionHighlight((h) => (h < filteredMentionMembers.length - 1 ? h + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionHighlight((h) => (h > 0 ? h - 1 : filteredMentionMembers.length - 1));
        return;
      }
      if (e.key === 'Enter' && filteredMentionMembers.length > 0) {
        e.preventDefault();
        const idx = Math.min(mentionHighlight, filteredMentionMembers.length - 1);
        insertMention(filteredMentionMembers[idx]);
      }
    },
    [mentionPicker.show, filteredMentionMembers, mentionHighlight, insertMention]
  );

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim() || sendingRef.current) return;
    sendingRef.current = true;
    try {
      const text = body.trim();
      setBody('');
      await sendParentChatMessage(text);
    } finally {
      sendingRef.current = false;
    }
  }

  async function handleRemove(messageId) {
    if (removingId) return;
    setRemovingId(messageId);
    try {
      await deleteParentChatMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="messages-page">
      <div className="messages-page__header">
        <h2 className="messages-page__title">Family chat</h2>
      </div>
      <div className="messages-page__body">
        {loading && (
          <p className="messages-page__loading">Loading...</p>
        )}
        {!loading && (
          <>
            <ul className="messages-page__list">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`messages-page__bubble ${m.sender_user_id === user?.id ? 'messages-page__bubble--own' : 'messages-page__bubble--other'}`}
                >
                  <div className="messages-page__bubble-head">
                    <p className="messages-page__sender">
                      {m.sender_user_id === user?.id ? 'You' : (m.senderUserName || 'Unknown')}
                    </p>
                    {canRemoveMessages ? (
                      <button
                        type="button"
                        onClick={() => handleRemove(m.id)}
                        disabled={removingId === m.id}
                        className="messages-page__remove"
                        aria-label="Remove message"
                      >
                        {removingId === m.id ? '…' : 'Remove'}
                      </button>
                    ) : null}
                  </div>
                  <p className="messages-page__text">{m.body}</p>
                  <p className="messages-page__time">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
              <li ref={bottomRef} aria-hidden="true" />
            </ul>
            <div className="messages-page__input-wrap">
              {mentionPicker.show && filteredMentionMembers.length > 0 && (
                <ul className="messages-page__mentions" role="listbox">
                  {filteredMentionMembers.map((m, i) => (
                    <li
                      key={m.id}
                      role="option"
                      aria-selected={i === mentionHighlight}
                      className={`messages-page__mention-item ${i === mentionHighlight ? 'messages-page__mention-item--active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMention(m);
                      }}
                    >
                      @{m.name}
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={handleSend} className="messages-page__form">
                <input
                  ref={inputRef}
                  type="text"
                  value={body}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Message everyone, or @name to mention someone"
                  className="messages-page__input"
                  aria-label="Message"
                />
                <button type="submit" className="messages-page__send">
                  Send
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
