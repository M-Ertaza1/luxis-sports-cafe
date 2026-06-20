import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import socket from '../socket';
import { Plus, Pencil, Trash2, Boxes, ChefHat } from 'lucide-react';
import ItemForm from '../components/ItemForm';
import StockManager from '../components/StockManager';
import RecipeManager from '../components/RecipeManager';
import ConfirmDialog from '../components/ConfirmDialog';
import { usePermission } from '../usePermission';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [stockItem, setStockItem] = useState(null);
  const [recipeItem, setRecipeItem] = useState(null);
  const allow = usePermission();

  function load() {
    api
      .get('/inventory')
      .then((res) => setItems(res.data))
      .catch(() => setError('Could not load inventory.'))
      .finally(() => setLoading(false));
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/inventory/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
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

  const showActions =
    allow('inventory.update') ||
    allow('inventory.delete') ||
    allow('stock.adjust') ||
    allow('recipe.manage');

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand">Inventory</h1>
        {allow('inventory.create') && (
          <button
            onClick={() => { setEditingItem(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition"
          >
            <Plus size={18} />
            New Item
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading inventory…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">No items yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Price</th>
                  <th className="text-left px-4 py-3 font-medium">Unit</th>
                  {showActions && <th className="text-right px-4 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{it.name}</td>
                    <td className="px-4 py-3 text-gray-600">{it.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        it.itemType === 'STOCK' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {it.itemType === 'STOCK' ? 'Stock' : 'Fresh'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">Rs {Number(it.price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{it.unit}</td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {it.itemType === 'FRESH_ON_DEMAND' && allow('recipe.manage') && (
                            <button onClick={() => setRecipeItem(it)} className="text-gray-400 hover:text-brand" aria-label="Manage recipe" title="Manage recipe">
                              <ChefHat size={16} />
                            </button>
                          )}
                          {it.itemType === 'STOCK' && allow('stock.adjust') && (
                            <button onClick={() => setStockItem(it)} className="text-gray-400 hover:text-brand" aria-label="Manage stock" title="Manage stock">
                              <Boxes size={16} />
                            </button>
                          )}
                          {allow('inventory.update') && (
                            <button onClick={() => { setEditingItem(it); setShowForm(true); }} className="text-gray-400 hover:text-brand" aria-label="Edit">
                              <Pencil size={16} />
                            </button>
                          )}
                          {allow('inventory.delete') && (
                            <button onClick={() => setDeleteTarget(it)} className="text-gray-400 hover:text-red-600" aria-label="Delete">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <ItemForm item={editingItem} onClose={() => setShowForm(false)} onSaved={load} />
      )}

      {stockItem && (
        <StockManager item={stockItem} onClose={() => setStockItem(null)} onChanged={load} />
      )}

      {recipeItem && (
        <RecipeManager item={recipeItem} onClose={() => setRecipeItem(null)} onChanged={load} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Item"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          working={deleting}
        />
      )}
    </Layout>
  );
}