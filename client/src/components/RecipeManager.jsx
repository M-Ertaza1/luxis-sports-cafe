import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../api';

export default function RecipeManager({ item, onClose, onChanged }) {
  const [recipe, setRecipe] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [newQty, setNewQty] = useState('');

  function loadRecipe() {
    api
      .get(`/inventory/${item.id}/recipe`)
      .then((res) => setRecipe(res.data))
      .catch(() => setError('Could not load recipe.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRecipe();
    api
      .get('/inventory?itemType=STOCK')
      .then((res) => setStockItems(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addIngredient() {
    if (!newIngredient || !newQty || Number(newQty) <= 0) {
      setError('Choose an ingredient and a positive quantity.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api.post(`/inventory/${item.id}/recipe`, {
        ingredientItemId: newIngredient,
        quantityRequired: Number(newQty),
      });
      setNewIngredient('');
      setNewQty('');
      loadRecipe();
      onChanged && onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add ingredient.');
    } finally {
      setBusy(false);
    }
  }

  async function removeIngredient(recipeId) {
    setBusy(true);
    try {
      await api.delete(`/inventory/recipe/${recipeId}`);
      loadRecipe();
      onChanged && onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove ingredient.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  const usedIds = recipe.map((r) => r.ingredientItemId);
  const availableStock = stockItems.filter((s) => !usedIds.includes(s.id));

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-brand dark:text-brand-light">Recipe</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Define which stock ingredients this item consumes. When sold, these are deducted automatically from the kitchen's stock.
          </p>

          {loading ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Loading…</p>
          ) : recipe.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No ingredients defined yet.</p>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
              {recipe.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-800 dark:text-gray-200">{r.ingredientItem?.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {Number(r.quantityRequired)} {r.ingredientItem?.unit}
                    </span>
                    <button
                      onClick={() => removeIngredient(r.id)}
                      disabled={busy}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                      aria-label="Remove ingredient"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Ingredient</p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                className={`${inputClass} flex-1 min-w-[160px]`}
              >
                <option value="">Select ingredient</option>
                {availableStock.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="any"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className={`${inputClass} w-24`}
                placeholder="Qty"
              />
              <button
                onClick={addIngredient}
                disabled={busy}
                className="flex items-center gap-1 bg-brand text-white px-3 py-2 rounded-lg text-sm hover:bg-brand-dark disabled:opacity-60"
              >
                <Plus size={15} /> Add
              </button>
            </div>
          </div>

          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark">Done</button>
        </div>
      </div>
    </div>
  );
}