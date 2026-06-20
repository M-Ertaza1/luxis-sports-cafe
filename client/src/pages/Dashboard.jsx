import { useState, useEffect } from 'react';
import {
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Trophy,
  BarChart3,
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
  const [period, setPeriod] = useState(30);
  const [analytics, setAnalytics] = useState(null);

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

  useEffect(() => {
    api
      .get(`/dashboard/analytics?period=${period}`)
      .then((res) => setAnalytics(res.data))
      .catch(() => {});
  }, [period]);

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

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={18} className="text-brand" />
            Performance Analytics
          </h2>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 3 months</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last 1 year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              Top Selling Items
            </h3>
            {!analytics ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : analytics.topItems.length === 0 ? (
              <p className="text-sm text-gray-400">No sales in this period.</p>
            ) : (
              <ul className="space-y-2">
                {analytics.topItems.map((it, i) => (
                  <li key={it.itemId} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      {it.name}
                    </span>
                    <span className="text-right">
                      <span className="font-medium text-gray-800">Rs {it.revenue.toLocaleString()}</span>
                      <span className="text-gray-400 text-xs block">{it.quantity} {it.unit} sold</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              Most Booked Arenas
            </h3>
            {!analytics ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : analytics.topArenas.length === 0 ? (
              <p className="text-sm text-gray-400">No bookings in this period.</p>
            ) : (
              <ul className="space-y-2">
                {analytics.topArenas.map((a, i) => (
                  <li key={a.arenaId} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      {a.name}
                    </span>
                    <span className="text-right">
                      <span className="font-medium text-gray-800">{a.bookingCount} bookings</span>
                      <span className="text-gray-400 text-xs block">Rs {a.revenue.toLocaleString()}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}