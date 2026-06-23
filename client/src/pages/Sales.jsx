import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import socket from '../socket';
import { ShoppingCart } from 'lucide-react';
import { usePermission } from '../usePermission';

function SaleForm({ onSold }) {
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState('');
  const [kitchen, setKitchen] = useState('MAIN');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/inventory').then((res) => setItems(res.data)).catch(() => {});
  }, []);

  const selectedItem = items.find((i) => i.id === itemId);

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
      const res = await api.post('/sales', {
        itemId,
        kitchen,
        quantity: Number(quantity),
      });
      setSuccess(`Sale recorded: Rs ${Number(res.data.totalAmount).toLocaleString()}`);
      setQuantity('');
      onSold && onSold();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record sale.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  const lineTotal = selectedItem && quantity ? Number(selectedItem.price) * Number(quantity) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
      <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Record a Sale</h2>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputClass}>
            <option value="">Select item</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name} — Rs {Number(i.price).toLocaleString()}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kitchen</label>
          <select value={kitchen} onChange={(e) => setKitchen(e.target.value)} className={inputClass}>
            <option value="MAIN">Main Kitchen</option>
            <option value="COUNTER">Counter Kitchen</option>
          </select>
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
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
          <ShoppingCart size={16} />
          Record Sale
        </button>
      </form>

      {lineTotal !== null && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          Total: <span className="font-medium text-gray-700 dark:text-gray-200">Rs {lineTotal.toLocaleString()}</span>
        </p>
      )}
      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2 mt-3">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-lg px-3 py-2 mt-3">{success}</div>}
    </div>
  );
}

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kitchenFilter, setKitchenFilter] = useState('');
  const allow = usePermission();

  function loadSales() {
    const url = kitchenFilter ? `/sales?kitchen=${kitchenFilter}` : '/sales';
    api
      .get(url)
      .then((res) => setSales(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSales();
    socket.connect();
    socket.on('change', loadSales);
    return () => {
      socket.off('change', loadSales);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitchenFilter]);

  const fmtDateTime = (d) => new Date(d).toLocaleString();

  const total = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-brand dark:text-brand-light mb-6">Sales</h1>

      {allow('sale.create') && <SaleForm onSold={loadSales} />}

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-800 dark:text-gray-100">Sales History</h2>
        <select
          value={kitchenFilter}
          onChange={(e) => setKitchenFilter(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">All Kitchens</option>
          <option value="MAIN">Main Kitchen</option>
          <option value="COUNTER">Counter Kitchen</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : sales.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500">No sales recorded.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-left px-4 py-3 font-medium">Kitchen</th>
                  <th className="text-left px-4 py-3 font-medium">Qty</th>
                  <th className="text-left px-4 py-3 font-medium">Unit Price</th>
                  <th className="text-left px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">By</th>
                  <th className="text-left px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{s.item?.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.kitchen}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{Number(s.quantity)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">Rs {Number(s.unitPrice).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">Rs {Number(s.totalAmount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.soldBy?.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{fmtDateTime(s.soldAt)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <td colSpan={4} className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Total</td>
                  <td className="px-4 py-3 font-bold text-brand dark:text-brand-light">Rs {total.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}