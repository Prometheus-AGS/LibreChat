import React, { useEffect, useRef, useState } from 'react';
import { createSupabase } from '/lib/supabase';
import { useChatStore } from '/lib/stores';

interface Message {
  id: string;
  content: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

export default function SupabaseRealtimeChat() {
  const { messages, loading, error, addMessage, setMessages, setLoading, setError } =
    useChatStore();

  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createSupabase();

  useEffect(() => {
    if (!supabase) {
      setError('Supabase is not configured. Please configure Supabase in the artifact settings.');
      return;
    }

    // Load existing messages when component mounts
    if (isJoined) {
      loadMessages();
      subscribeToMessages();
    }

    return () => {
      if (supabase) {
        supabase.removeAllChannels();
      }
    };
  }, [supabase, isJoined]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!supabase) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          addMessage(payload.new as Message);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleJoinChat = () => {
    if (!userName.trim()) return;
    setIsJoined(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !newMessage.trim() || !userName.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert([
        {
          content: newMessage.trim(),
          user_id: `user_${Date.now()}`, // Simple user ID for demo
          user_name: userName,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleLeaveChat = () => {
    if (supabase) {
      supabase.removeAllChannels();
    }
    setIsJoined(false);
    setMessages([]);
  };

  if (!supabase) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Configuration Required</h2>
        <p className="text-red-600">This artifact requires Supabase configuration. Please:</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-red-600">
          <li>Enable Supabase in the artifact settings</li>
          <li>Provide your Supabase URL and Anonymous Key</li>
          <li>
            Create a 'messages' table with columns: id (uuid), content (text), user_id (text),
            user_name (text), created_at (timestamp)
          </li>
          <li>Enable Row Level Security and set appropriate policies</li>
          <li>Enable Realtime for the 'messages' table</li>
        </ol>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Join Chat Room</h1>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-100 p-3 text-red-700">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleJoinChat();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!userName.trim()}
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Join Chat
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by Supabase Realtime + Zustand</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-500 p-4 text-white">
        <h1 className="text-lg font-bold">Chat Room</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm">Hi, {userName}!</span>
          <button onClick={handleLeaveChat} className="text-sm text-blue-200 hover:text-white">
            Leave
          </button>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-300 bg-red-100 p-3 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="h-80 space-y-3 overflow-y-auto p-4">
        {loading && messages.length === 0 ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.user_name === userName ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-lg px-3 py-2 ${
                  message.user_name === userName
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {message.user_name !== userName && (
                  <div className="mb-1 text-xs font-medium opacity-75">{message.user_name}</div>
                )}
                <div className="text-sm">{message.content}</div>
                <div className="mt-1 text-xs opacity-75">
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>

      <div className="px-4 pb-2 text-center text-xs text-gray-500">
        <p>Real-time chat powered by Supabase</p>
      </div>
    </div>
  );
}
