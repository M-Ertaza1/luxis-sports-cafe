import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import socket from '../socket';
import { Plus, Pencil, Trash2, LayoutList, CalendarDays } from 'lucide-react';
import BookingForm from '../components/BookingForm';
import BookingCalendar from '../components/BookingCalendar';
import ConfirmDialog from '../components/ConfirmDialog';
import { usePermission } from '../usePermission';

const sportColors = {
  CRICKET: 'bg-sport-cricket',
  FUTSAL: 'bg-sport-futsal',
  HANDBALL: 'bg-sport-handball',
  SUBSOCCER: 'bg-sport-subsoccer',
};

function StatusBadge({ status }) {
  const styles = {
    WAITING_PAYMENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    CANCELLED: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  };
  const labels = {
    WAITING_PAYMENT: 'Waiting Payment',
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}

function PaymentBadge({ status }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        status === 'PAID'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      }`}
    >
      {status}
    </span>
  );
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [view, setView] = useState('table');
  const allow = usePermission();

  function load() {
    api
      .get('/bookings')
      .then((res) => setBookings(res.data))
      .catch(() => setError('Could not load bookings.'))
      .finally(() => setLoading(false));
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/bookings/${deleteTarget.id}`);
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

  const fmtTime = (t) => t?.slice(11, 16);
  const fmtDate = (d) => d?.slice(0, 10);

  const showActions = allow('booking.update') || allow('booking.delete');

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-brand dark:text-brand-light">Bookings</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm ${view === 'table' ? 'bg-brand text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <LayoutList size={16} /> Table
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm ${view === 'calendar' ? 'bg-brand text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <CalendarDays size={16} /> Calendar
            </button>
          </div>
          {allow('booking.create') && (
            <button
              onClick={() => { setEditingBooking(null); setShowForm(true); }}
              className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition"
            >
              <Plus size={18} />
              New Booking
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading bookings…</p>
      ) : error ? (
        <p className="text-red-600 dark:text-red-400">{error}</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500">No bookings yet.</p>
      ) : view === 'calendar' ? (
        <BookingCalendar
          bookings={bookings}
          onSelectBooking={(b) => { setEditingBooking(b); setShowForm(true); }}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Arena</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-left px-4 py-3 font-medium">Price</th>
                  <th className="text-left px-4 py-3 font-medium">Payment</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  {showActions && <th className="text-right px-4 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 dark:text-gray-100">{b.customerName}</div>
                      <div className="text-gray-400 dark:text-gray-500 text-xs">{b.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${sportColors[b.arena?.sportType] || 'bg-gray-300'}`} />
                        {b.arena?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{fmtDate(b.bookingDate)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{fmtTime(b.startTime)}–{fmtTime(b.endTime)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">Rs {Number(b.price).toLocaleString()}</td>
                    <td className="px-4 py-3"><PaymentBadge status={b.paymentStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={b.bookingStatus} /></td>
                    {showActions && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {allow('booking.update') && b.bookingStatus !== 'COMPLETED' && (
                            <button
                              onClick={() => { setEditingBooking(b); setShowForm(true); }}
                              className="text-gray-400 dark:text-gray-500 hover:text-brand dark:hover:text-brand-light"
                              aria-label="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {allow('booking.delete') && (
                            <button
                              onClick={() => setDeleteTarget(b)}
                              className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                              aria-label="Delete"
                            >
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
        <BookingForm
          booking={editingBooking}
          onClose={() => setShowForm(false)}
          onSaved={load}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Booking"
          message={`Delete the booking for ${deleteTarget.customerName}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          working={deleting}
        />
      )}
    </Layout>
  );
}