import { useAuth } from '../useAuth';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Dashboard</h1>
        <button
          onClick={logout}
          className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition"
        >
          Logout
        </button>
      </div>
      <p className="text-gray-700">
        Welcome, <span className="font-medium">{user?.name}</span>. You're logged in as{' '}
        <span className="font-medium">{user?.role}</span>.
      </p>
    </div>
  );
}