import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import socket from '../socket';

const actionColors = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  SALE: 'bg-purple-100 text-purple-700',
  TRANSFER: 'bg-amber-100 text-amber-700',
  STOCK_ADJUST: 'bg-gray-100 text-gray-600',
};

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get('/audit')
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
  }, []);

  const fmtDateTime = (d) => new Date(d).toLocaleString();

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-brand mb-6">Activity Log</h1>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-400">No activity recorded.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Action</th>
                  <th className="text-left px-4 py-3 font-medium">Entity</th>
                  <th className="text-left px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{log.user?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.actionType] || 'bg-gray-100 text-gray-600'}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{log.entityType}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDateTime(log.createdAt)}</td>
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