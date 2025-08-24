import React, { useEffect, useState } from 'react';
import { createSupabase } from '/lib/supabase';
import { useUserStore } from '/lib/stores';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export default function SupabaseUserProfile() {
  const { user, loading, error, setUser, setLoading, setError } = useUserStore();

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
  });

  const supabase = createSupabase();

  useEffect(() => {
    if (!supabase) {
      setError('Supabase is not configured. Please configure Supabase in the artifact settings.');
      return;
    }

    loadUserProfile();
  }, [supabase]);

  const loadUserProfile = async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      // Get current user
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) throw new Error('No authenticated user found');

      // Get user profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const profile: UserProfile = data || {
        id: authUser.id,
        email: authUser.email || '',
        full_name: '',
        bio: '',
        avatar_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUser(profile);
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setUser({
        ...user,
        ...formData,
        updated_at: new Date().toISOString(),
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      bio: user?.bio || '',
      avatar_url: user?.avatar_url || '',
    });
    setEditing(false);
  };

  if (!supabase) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Configuration Required</h2>
        <p className="text-red-600">This artifact requires Supabase configuration. Please:</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-red-600">
          <li>Enable Supabase in the artifact settings</li>
          <li>Provide your Supabase URL and Anonymous Key</li>
          <li>Set up Supabase Auth</li>
          <li>
            Create a 'profiles' table with columns: id (uuid), full_name (text), bio (text),
            avatar_url (text)
          </li>
        </ol>
      </div>
    );
  }

  if (loading && !user) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
          <div className="mb-4 h-4 w-1/2 rounded bg-gray-200"></div>
          <div className="h-4 w-5/6 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-md rounded-lg bg-white p-6 shadow-lg">
      <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">User Profile</h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-100 p-3 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {user && (
        <div className="space-y-4">
          {/* Avatar */}
          <div className="text-center">
            {(editing ? formData.avatar_url : user.avatar_url) ? (
              <img
                src={editing ? formData.avatar_url : user.avatar_url}
                alt="Avatar"
                className="mx-auto h-20 w-20 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=3b82f6&color=fff`;
                }}
              />
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500 text-xl font-bold text-white">
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            {editing ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            ) : (
              <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                {user.full_name || 'Not set'}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
            {editing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="min-h-[80px] rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                {user.bio || 'No bio provided'}
              </p>
            )}
          </div>

          {/* Avatar URL */}
          {editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Avatar URL</label>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t pt-4 text-center text-xs text-gray-500">
            <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
            <p>Updated: {new Date(user.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Powered by Supabase + Zustand</p>
      </div>
    </div>
  );
}
