import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import socket from '../socket';

const actionColors = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  SALE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  TRANSFER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  STOCK_ADJUST: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  function getRange() {
    switch (preset) {
      case 'today':
        return { from: todayStr(), to: todayStr() };
      case 'yesterday':
        return { from: daysAgo(1), to: daysAgo(1) };
      case 'last3':
        return { from: daysAgo(2), to: todayStr() };
      case 'last7':
        return { from: daysAgo(6), to: todayStr() };
      case 'custom':
        return { from: customFrom, to: customTo };
      default:
        return { from: '', to: '' };
    }
  }

  function load() {
    const { from, to } = getRange();
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const qs = params.toString();
    api
      .get(`/audit${qs ? `?${qs}` : ''}`)
      .then((res) => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    socket.connect();
    socket.on('change', load);
    return () => {
      socket.off('change', load);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo]);

  const fmtDateTime = (d) => new Date(d).toLocaleString();

  const presetBtn = (key, label) => (
    <button
      onClick={() => setPreset(key)}
      className={`px-3 py-1.5 text-sm rounded-lg border transition ${
        preset === key
          ? 'bg-brand text-white border-brand'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-brand dark:text-brand-light mb-6">Activity Log</h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {presetBtn('all', 'All')}
        {presetBtn('today', 'Today')}
        {presetBtn('yesterday', 'Yesterday')}
        {presetBtn('last3', 'Last 3 days')}
        {presetBtn('last7', 'Last 7 days')}
        {presetBtn('custom', 'Custom')}

        {preset === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <span className="text-gray-400 dark:text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500">No activity in this period.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Entity</th>
                  <th className="text-left px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{log.user?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.actionType] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.entityType}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{fmtDateTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}