import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../api';

const CATEGORIES = [
  'Beverages', 'Soft Drinks', 'Water', 'Hot Drinks', 'Snacks', 'Chips',
  'Burgers', 'Sandwiches', 'Wraps & Rolls', 'Fast Food', 'Bakery', 'Frozen',
  'Ingredients', 'Desserts',
];

export default function ItemForm({ item, onClose, onSaved }) {
  const isEdit = Boolean(item);
  const initialCategoryIsKnown = item?.category ? CATEGORIES.includes(item.category) : true;

  const [form, setForm] = useState({
    name: item?.name || '',
    category: initialCategoryIsKnown ? (item?.category || '') : 'Other',
    customCategory: initialCategoryIsKnown ? '' : (item?.category || ''),
    price: item?.price != null ? String(item.price) : '',
    itemType: item?.itemType || 'STOCK',
    unit: item?.unit || '',
    reorderThreshold: item?.reorderThreshold != null ? String(item.reorderThreshold) : '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const finalCategory = form.category === 'Other' ? form.customCategory.trim() : form.category;
    if (!finalCategory) {
      setError('Please choose or enter a category.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: finalCategory,
        price: Number(form.price),
        unit: form.unit,
      };
      if (form.reorderThreshold !== '') {
        payload.reorderThreshold = Number(form.reorderThreshold);
      }
      if (isEdit) {
        await api.put(`/inventory/${item.id}`, payload);
      } else {
        payload.itemType = form.itemType;
        await api.post('/inventory', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save item.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-brand dark:text-brand-light">{isEdit ? 'Edit Item' : 'New Item'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select value={form.category} onChange={(e) => update('category', e.target.value)} className={inputClass} required>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Other">Other…</option>
            </select>
            {form.category === 'Other' && (
              <input
                value={form.customCategory}
                onChange={(e) => update('customCategory', e.target.value)}
                className={`${inputClass} mt-2`}
                placeholder="Type custom category"
                required
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
              <input value={form.unit} onChange={(e) => update('unit', e.target.value)} className={inputClass} placeholder="bottles, pieces…" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (Rs)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              value={form.itemType}
              onChange={(e) => update('itemType', e.target.value)}
              className={inputClass}
              disabled={isEdit}
            >
              <option value="STOCK">Stock Item</option>
              <option value="FRESH_ON_DEMAND">Fresh on Demand</option>
            </select>
            {isEdit && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Item type can't be changed after creation.</p>}
          </div>

          {form.itemType === 'STOCK' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low-Stock Alert Threshold (optional)</label>
              <input type="number" min="0" value={form.reorderThreshold} onChange={(e) => update('reorderThreshold', e.target.value)} className={inputClass} placeholder="e.g. 30" />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Alert when stock falls below this in any kitchen.</p>
            </div>
          )}

          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-60">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}