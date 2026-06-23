import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import api from '../api';

const KITCHENS = [
  { key: 'MAIN', label: 'Main Kitchen' },
  { key: 'COUNTER', label: 'Counter Kitchen' },
];

export default function StockManager({ item, onClose, onChanged }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [amounts, setAmounts] = useState({ MAIN: '', COUNTER: '' });

  function loadStock() {
    api
      .get(`/inventory/${item.id}/stock`)
      .then((res) => setStock(res.data))
      .catch(() => setError('Could not load stock.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function qtyFor(kitchen) {
    const row = stock.find((s) => s.kitchen === kitchen);
    return row ? Number(row.quantity) : 0;
  }

  async function adjust(kitchen, sign) {
    const raw = amounts[kitchen];
    const amount = Number(raw);
    if (!raw || amount <= 0) {
      setError('Enter a positive amount.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.post(`/inventory/${item.id}/stock`, {
        kitchen,
        quantityChange: sign * amount,
      });
      setAmounts((a) => ({ ...a, [kitchen]: '' }));
      loadStock();
      onChanged && onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not adjust stock.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-24 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-brand dark:text-brand-light">Manage Stock</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading…</p>
          ) : (
            <>
              {KITCHENS.map(({ key, label }) => (
                <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-800 dark:text-gray-100">{label}</span>
                    <span className="text-lg font-bold text-brand dark:text-brand-light">
                      {qtyFor(key)} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">{item.unit}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={amounts[key]}
                      onChange={(e) => setAmounts((a) => ({ ...a, [key]: e.target.value }))}
                      className={inputClass}
                      placeholder="Qty"
                    />
                    <button
                      onClick={() => adjust(key, 1)}
                      disabled={busy}
                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-60"
                    >
                      <Plus size={15} /> Add
                    </button>
                    <button
                      onClick={() => adjust(key, -1)}
                      disabled={busy}
                      className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-60"
                    >
                      <Minus size={15} /> Remove
                    </button>
                  </div>
                </div>
              ))}

              {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>}

              <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
                Note: Counter normally receives stock via transfers from Main. Direct adjustments here are for corrections and initial stocking.
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark">Done</button>
        </div>
      </div>
    </div>
  );
}