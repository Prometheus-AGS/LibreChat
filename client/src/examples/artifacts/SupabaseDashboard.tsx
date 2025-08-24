import React, { useEffect, useState } from 'react';
import { createSupabase } from '/lib/supabase';
import { useDashboardStore } from '/lib/stores';

interface DashboardData {
  totalUsers: number;
  totalPosts: number;
  recentActivity: Array<{
    id: string;
    type: 'user' | 'post';
    title: string;
    created_at: string;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
}

export default function SupabaseDashboard() {
  const { data, loading, error, setData, setLoading, setError, refreshData } = useDashboardStore();

  const [refreshing, setRefreshing] = useState(false);
  const supabase = createSupabase();

  useEffect(() => {
    if (!supabase) {
      setError('Supabase is not configured. Please configure Supabase in the artifact settings.');
      return;
    }

    loadDashboardData();
  }, [supabase]);

  const loadDashboardData = async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      // Fetch total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch total posts
      const { count: totalPosts, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      if (postsError) throw postsError;

      // Fetch recent activity
      const { data: recentUsers, error: recentUsersError } = await supabase
        .from('users')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentUsersError) throw recentUsersError;

      const { data: recentPosts, error: recentPostsError } = await supabase
        .from('posts')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentPostsError) throw recentPostsError;

      // Combine and sort recent activity
      const recentActivity = [
        ...(recentUsers || []).map((user) => ({
          id: user.id,
          type: 'user' as const,
          title: `New user: ${user.name}`,
          created_at: user.created_at,
        })),
        ...(recentPosts || []).map((post) => ({
          id: post.id,
          type: 'post' as const,
          title: `New post: ${post.title}`,
          created_at: post.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      // Fetch user growth data (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: userGrowthData, error: growthError } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (growthError) throw growthError;

      // Process user growth data
      const userGrowth = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];

        const count = (userGrowthData || []).filter((user) =>
          user.created_at.startsWith(dateStr),
        ).length;

        return {
          date: dateStr,
          count,
        };
      });

      const dashboardData: DashboardData = {
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        recentActivity,
        userGrowth,
      };

      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    refreshData();
  };

  if (!supabase) {
    return (
      <div className="mx-auto mt-8 max-w-4xl rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Configuration Required</h2>
        <p className="text-red-600">This artifact requires Supabase configuration. Please:</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-red-600">
          <li>Enable Supabase in the artifact settings</li>
          <li>Provide your Supabase URL and Anonymous Key</li>
          <li>
            Create 'users' table with columns: id (uuid), name (text), email (text), created_at
            (timestamp)
          </li>
          <li>
            Create 'posts' table with columns: id (uuid), title (text), content (text), user_id
            (uuid), created_at (timestamp)
          </li>
        </ol>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="mx-auto mt-8 max-w-4xl rounded-lg bg-white p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/3 rounded bg-gray-200"></div>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-24 rounded bg-gray-200"></div>
            <div className="h-24 rounded bg-gray-200"></div>
          </div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-4xl rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded border border-red-300 bg-red-100 p-4 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h3 className="mb-2 text-lg font-semibold text-blue-800">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">{data.totalUsers}</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-6">
              <h3 className="mb-2 text-lg font-semibold text-green-800">Total Posts</h3>
              <p className="text-3xl font-bold text-green-600">{data.totalPosts}</p>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">User Growth (Last 7 Days)</h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex h-32 items-end justify-between gap-2">
                {data.userGrowth.map((day, index) => (
                  <div key={day.date} className="flex flex-1 flex-col items-center">
                    <div
                      className="min-h-[4px] w-full rounded-t bg-blue-500"
                      style={{
                        height: `${Math.max(4, (day.count / Math.max(...data.userGrowth.map((d) => d.count), 1)) * 100)}px`,
                      }}
                    ></div>
                    <div className="mt-2 text-center text-xs text-gray-600">
                      <div className="font-semibold">{day.count}</div>
                      <div>
                        {new Date(day.date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Recent Activity</h3>
            <div className="space-y-3">
              {data.recentActivity.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No recent activity</p>
              ) : (
                data.recentActivity.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          activity.type === 'user' ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                      ></div>
                      <span className="text-gray-800">{activity.title}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <div className="mt-8 border-t pt-4 text-center text-sm text-gray-500">
        <p>
          Last updated: {data ? new Date().toLocaleTimeString() : 'Never'} • Powered by Supabase +
          Zustand
        </p>
      </div>
    </div>
  );
}
