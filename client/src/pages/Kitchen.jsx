import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import socket from '../socket';
import { ArrowRight, Send } from 'lucide-react';
import { usePermission } from '../usePermission';

function TransferForm({ onTransferred }) {
  const [stockItems, setStockItems] = useState([]);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [mainStock, setMainStock] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/inventory?itemType=STOCK').then((res) => setStockItems(res.data)).catch(() => {});
  }, []);

  // When an item is selected, fetch its Main Kitchen stock so we know what's available
  useEffect(() => {
    if (!itemId) return;
    let cancelled = false;
    api.get(`/inventory/${itemId}/stock`).then((res) => {
      if (cancelled) return;
      const main = res.data.find((s) => s.kitchen === 'MAIN');
      setMainStock(main ? Number(main.quantity) : 0);
    }).catch(() => {
      if (!cancelled) setMainStock(null);
    });
    return () => { cancelled = true; };
  }, [itemId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!itemId || !quantity || Number(quantity) <= 0) {
      setError('Choose an item and a positive quantity.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/transfers', { itemId, quantity: Number(quantity) });
      setSuccess('Transfer completed.');
      setQuantity('');
      // refresh the main stock display
      const res = await api.get(`/inventory/${itemId}/stock`);
      const main = res.data.find((s) => s.kitchen === 'MAIN');
      setMainStock(main ? Number(main.quantity) : 0);
      onTransferred && onTransferred();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not complete transfer.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  const selectedItem = stockItems.find((s) => s.id === itemId);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-bold text-gray-800">Main Kitchen</span>
        <ArrowRight size={18} className="text-brand" />
        <span className="font-bold text-gray-800">Counter Kitchen</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputClass}>
            <option value="">Select stock item</option>
            {stockItems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
            placeholder="Qty"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition disabled:opacity-60"
        >
          <Send size={16} />
          Transfer
        </button>
      </form>

      {itemId && mainStock !== null && (
        <p className="text-sm text-gray-500 mt-3">
          Available in Main Kitchen: <span className="font-medium text-gray-700">{mainStock} {selectedItem?.unit}</span>
        </p>
      )}
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mt-3">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2 mt-3">{success}</div>}
    </div>
  );
}

export default function Kitchen() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState({ main: [], counter: [] });
  const allow = usePermission();

  function loadTransfers() {
    api
      .get('/transfers')
      .then((res) => setTransfers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function loadStock() {
    api
      .get('/inventory/stock/all')
      .then((res) => setStock(res.data))
      .catch(() => {});
  }

  function loadAll() {
    loadTransfers();
    loadStock();
  }

  useEffect(() => {
    loadAll();
    socket.connect();
    socket.on('change', loadAll);
    return () => {
      socket.off('change', loadAll);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtDateTime = (d) => new Date(d).toLocaleString();

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-brand mb-6">Kitchen Transfers</h1>

      {allow('transfer.create') && <TransferForm onTransferred={loadAll} />}

      <h2 className="font-bold text-gray-800 mb-3">Current Stock</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-brand text-white font-medium text-sm">Main Kitchen</div>
          {stock.main.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-4">No stock in Main Kitchen.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stock.main.map((s) => (
                <li key={s.itemId} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-800">{s.name}</span>
                  <span className="font-medium text-gray-700">{s.quantity} <span className="text-gray-400 font-normal">{s.unit}</span></span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-700 text-white font-medium text-sm">Counter Kitchen</div>
          {stock.counter.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-4">No stock in Counter Kitchen.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stock.counter.map((s) => (
                <li key={s.itemId} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-800">{s.name}</span>
                  <span className="font-medium text-gray-700">{s.quantity} <span className="text-gray-400 font-normal">{s.unit}</span></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="font-bold text-gray-800 mb-3">Transfer History</h2>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : transfers.length === 0 ? (
        <p className="text-gray-400">No transfers yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-left px-4 py-3 font-medium">Quantity</th>
                  <th className="text-left px-4 py-3 font-medium">Direction</th>
                  <th className="text-left px-4 py-3 font-medium">By</th>
                  <th className="text-left px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{t.item?.name}</td>
                    <td className="px-4 py-3 text-gray-700">{Number(t.quantity)} {t.item?.unit}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        {t.fromKitchen} <ArrowRight size={14} /> {t.toKitchen}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.transferredBy?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDateTime(t.transferredAt)}</td>
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