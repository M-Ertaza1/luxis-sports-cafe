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
    // Load all stock items to populate the ingredient dropdown
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
    'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  // Stock items not already in the recipe (avoid duplicates in dropdown)
  const usedIds = recipe.map((r) => r.ingredientItemId);
  const availableStock = stockItems.filter((s) => !usedIds.includes(s.id));

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-brand">Recipe</h2>
            <p className="text-sm text-gray-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Define which stock ingredients this item consumes. When sold, these are deducted automatically from the kitchen's stock.
          </p>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : recipe.length === 0 ? (
            <p className="text-sm text-gray-400">No ingredients defined yet.</p>
          ) : (
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
              {recipe.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-800">{r.ingredientItem?.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {Number(r.quantityRequired)} {r.ingredientItem?.unit}
                    </span>
                    <button
                      onClick={() => removeIngredient(r.id)}
                      disabled={busy}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                      aria-label="Remove ingredient"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Add Ingredient</p>
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

          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark">Done</button>
        </div>
      </div>
    </div>
  );
}