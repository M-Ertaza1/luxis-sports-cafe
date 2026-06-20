import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../api';

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
    bookingStatus: booking?.bookingStatus || 'CONFIRMED',
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
          bookingStatus: form.bookingStatus,
          notes: form.notes,
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
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-brand">{isEdit ? 'Edit Booking' : 'New Booking'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arena</label>
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
            {isEdit && <p className="text-xs text-gray-400 mt-1">Arena can't be changed when editing.</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input value={form.customerName} onChange={(e) => update('customerName', e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.bookingDate} onChange={(e) => update('bookingDate', e.target.value)} className={inputClass} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
              <select value={form.paymentStatus} onChange={(e) => update('paymentStatus', e.target.value)} className={inputClass}>
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.bookingStatus} onChange={(e) => update('bookingStatus', e.target.value)} className={inputClass}>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputClass} rows={2} />
          </div>

          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancel
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