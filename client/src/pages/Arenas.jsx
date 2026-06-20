import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import socket from '../socket';
import { Pencil, X, AlertTriangle } from 'lucide-react';

const sportColors = {
  CRICKET: 'bg-sport-cricket',
  FUTSAL: 'bg-sport-futsal',
  HANDBALL: 'bg-sport-handball',
  SUBSOCCER: 'bg-sport-subsoccer',
};

function PriceEditDialog({ arena, onClose, onSaved }) {
  const [rate, setRate] = useState(String(arena.hourlyRate));
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    setError('');
    try {
      await api.put(`/arenas/${arena.id}`, { hourlyRate: Number(rate) });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update price.');
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-brand">Edit Hourly Rate</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4">
          {!confirming ? (
            <>
              <p className="text-sm text-gray-600 mb-3">{arena.name}</p>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (Rs)</label>
              <input
                type="number"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className={inputClass}
              />
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => setConfirming(true)}
                  disabled={rate === '' || Number(rate) < 0}
                  className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 text-amber-600 rounded-full p-2">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Confirm Price Change</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Change {arena.name} from Rs {Number(arena.hourlyRate).toLocaleString()} to{' '}
                    Rs {Number(rate).toLocaleString()} per hour? This affects all future bookings.
                  </p>
                </div>
              </div>
              {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mt-3">{error}</div>}
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setConfirming(false)} disabled={saving} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Back</button>
                <button onClick={handleConfirm} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-60">
                  {saving ? 'Saving…' : 'Confirm Change'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Arenas() {
  const [arenas, setArenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  function load() {
    api.get('/arenas').then((res) => setArenas(res.data)).catch(() => {}).finally(() => setLoading(false));
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

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-brand mb-6">Arenas & Pricing</h1>

      {loading ? (
        <p className="text-gray-500">Loading arenas…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {arenas.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${sportColors[a.sportType] || 'bg-gray-300'}`} />
                <div>
                  <div className="font-bold text-gray-800">{a.name}</div>
                  <div className="text-sm text-gray-500">Rs {Number(a.hourlyRate).toLocaleString()} / hour</div>
                </div>
              </div>
              <button
                onClick={() => setEditing(a)}
                className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-dark font-medium"
              >
                <Pencil size={15} />
                Edit Rate
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PriceEditDialog arena={editing} onClose={() => setEditing(null)} onSaved={load} />
      )}
    </Layout>
  );
}