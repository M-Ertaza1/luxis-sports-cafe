import { useState, useEffect } from 'react';
import {
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api';
import socket from '../socket';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <Icon size={18} className={accent} />
      </div>
      <div className="text-2xl font-bold text-gray-800 mt-2">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    function loadDashboard() {
      api
        .get('/dashboard')
        .then((res) => setData(res.data))
        .catch(() => setError('Could not load dashboard data.'))
        .finally(() => setLoading(false));
    }

    loadDashboard();

    socket.connect();
    socket.on('change', loadDashboard);

    return () => {
      socket.off('change', loadDashboard);
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <Layout>
        <p className="text-gray-500">Loading dashboard…</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <p className="text-red-600">{error}</p>
      </Layout>
    );
  }

  const fmt = (n) => 'Rs ' + Number(n).toLocaleString();

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-brand mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={fmt(data.revenue.total)}
          accent="text-green-600"
        />
        <StatCard
          icon={CalendarDays}
          label="Booking Revenue"
          value={fmt(data.revenue.bookings)}
          accent="text-sport-cricket"
        />
        <StatCard
          icon={ShoppingCart}
          label="Café Sales"
          value={fmt(data.revenue.sales)}
          accent="text-sport-subsoccer"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock Alerts"
          value={data.lowStockAlerts.length}
          accent="text-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 mb-3">Today's Bookings</h2>
          {data.todaysBookings.length === 0 ? (
            <p className="text-sm text-gray-400">No bookings today.</p>
          ) : (
            <ul className="space-y-2">
              {data.todaysBookings.map((b) => (
                <li key={b.id} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span>{b.customerName} — {b.arena.name}</span>
                  <span className="text-gray-500">{b.startTime?.slice(11, 16)}–{b.endTime?.slice(11, 16)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 mb-3">Upcoming Bookings</h2>
          {data.upcomingBookings.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming bookings.</p>
          ) : (
            <ul className="space-y-2">
              {data.upcomingBookings.map((b) => (
                <li key={b.id} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span>{b.customerName} — {b.arena.name}</span>
                  <span className="text-gray-500">{b.bookingDate?.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 mb-3">Low Stock Alerts</h2>
          {data.lowStockAlerts.length === 0 ? (
            <p className="text-sm text-gray-400">All stock levels healthy.</p>
          ) : (
            <ul className="space-y-2">
              {data.lowStockAlerts.map((a, i) => (
                <li key={i} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span>{a.itemName} <span className="text-gray-400">({a.kitchen})</span></span>
                  <span className="text-red-600">{a.quantity} / {a.threshold} {a.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 mb-3">Kitchen Sales</h2>
          {data.kitchenSales.length === 0 ? (
            <p className="text-sm text-gray-400">No sales recorded.</p>
          ) : (
            <ul className="space-y-2">
              {data.kitchenSales.map((k) => (
                <li key={k.kitchen} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                  <span>{k.kitchen} Kitchen</span>
                  <span className="text-gray-700">{fmt(k.totalSales)} · {k.transactionCount} sales</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
        <h2 className="font-bold text-gray-800 mb-3">Recent Activity</h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400">No recent activity.</p>
        ) : (
          <ul className="space-y-2">
            {data.recentActivity.map((log) => (
              <li key={log.id} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span>
                  <span className="font-medium">{log.user?.name}</span>{' '}
                  <span className="text-gray-500">{log.actionType} {log.entityType}</span>
                </span>
                <span className="text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}