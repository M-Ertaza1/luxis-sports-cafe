import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../api';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function BookingForm({ booking, onClose, onSaved }) {
  const isEdit = Boolean(booking);
  const [arenas, setArenas] = useState([]);
  const [form, setForm] = useState({
    arenaId: booking?.arenaId || '',
    customerName: booking?.customerName || '',
    customerPhone: booking?.customerPhone || '',
    bookingDate: booking?.bookingDate?.slice(0, 10) || '',
    startTime: booking?.startTime?.slice(11, 16) || '',
    endTime: booking?.endTime?.slice(11, 16) || '',
    paymentStatus: booking?.paymentStatus || 'UNPAID',
    notes: booking?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/arenas').then((res) => setArenas(res.data)).catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await save({});
  }

  async function save(extra) {
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/bookings/${booking.id}`, {
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          bookingDate: form.bookingDate,
          startTime: form.startTime,
          endTime: form.endTime,
          paymentStatus: form.paymentStatus,
          notes: form.notes,
          ...extra,
        });
      } else {
        await api.post('/bookings', {
          arenaId: form.arenaId,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          bookingDate: form.bookingDate,
          startTime: form.startTime,
          endTime: form.endTime,
          paymentStatus: form.paymentStatus,
          notes: form.notes,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save booking.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  const derivedStatus = form.paymentStatus === 'PAID' ? 'Confirmed' : 'Waiting for Payment';
  const currentStatus = booking?.bookingStatus;
  const canCancel = isEdit && form.paymentStatus === 'UNPAID' && currentStatus !== 'CANCELLED';
  const canComplete = isEdit && currentStatus === 'CONFIRMED';

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-brand dark:text-brand-light">{isEdit ? 'Edit Booking' : 'New Booking'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arena</label>
            <select
              value={form.arenaId}
              onChange={(e) => update('arenaId', e.target.value)}
              className={inputClass}
              required
              disabled={isEdit}
            >
              <option value="">Select an arena</option>
              {arenas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {isEdit && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Arena can't be changed when editing.</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
              <input value={form.customerName} onChange={(e) => update('customerName', e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input type="date" value={form.bookingDate} onChange={(e) => update('bookingDate', e.target.value)} className={inputClass} min={todayStr()} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment</label>
            <select value={form.paymentStatus} onChange={(e) => update('paymentStatus', e.target.value)} className={inputClass}>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
            </select>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Status will be: <span className="font-medium text-gray-600 dark:text-gray-300">{derivedStatus}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputClass} rows={2} />
          </div>

          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>}

          {isEdit && (canComplete || canCancel) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {canComplete && (
                <button
                  type="button"
                  onClick={() => save({ bookingStatus: 'COMPLETED' })}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                >
                  Mark as Completed
                </button>
              )}
              {canCancel && (
                <button
                  type="button"
                  onClick={() => save({ bookingStatus: 'CANCELLED' })}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Close
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-60">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}