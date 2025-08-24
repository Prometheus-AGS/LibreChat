import React, { useEffect } from 'react';
import { createSupabase } from '/lib/supabase';
import { useTodoStore } from '/lib/stores';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export default function SupabaseTodoApp() {
  const { todos, loading, error, addTodo, toggleTodo, deleteTodo, loadTodos, setError } =
    useTodoStore();

  const supabase = createSupabase();

  useEffect(() => {
    if (!supabase) {
      setError('Supabase is not configured. Please configure Supabase in the artifact settings.');
      return;
    }

    loadSupabaseTodos();
  }, [supabase]);

  const loadSupabaseTodos = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      loadTodos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    }
  };

  const handleAddTodo = async (text: string) => {
    if (!supabase || !text.trim()) return;

    try {
      const newTodo = {
        text: text.trim(),
        completed: false,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('todos').insert([newTodo]).select().single();

      if (error) throw error;
      addTodo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    }
  };

  const handleToggleTodo = async (id: string) => {
    if (!supabase) return;

    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', id);

      if (error) throw error;
      toggleTodo(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);

      if (error) throw error;
      deleteTodo(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  const [newTodoText, setNewTodoText] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddTodo(newTodoText);
    setNewTodoText('');
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
            Create a 'todos' table with columns: id (uuid), text (text), completed (boolean),
            created_at (timestamp)
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-md rounded-lg bg-white p-6 shadow-lg">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Supabase Todo App</h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-100 p-3 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Add a new todo..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newTodoText.trim()}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '...' : 'Add'}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="py-4 text-center text-gray-500">No todos yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id)}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span
                className={`flex-1 ${
                  todo.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="rounded px-2 py-1 text-red-500 hover:text-red-700"
                title="Delete todo"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          {todos.length} total • {todos.filter((t) => !t.completed).length} active
        </p>
        <p className="mt-1">Powered by Supabase + Zustand</p>
      </div>
    </div>
  );
}
