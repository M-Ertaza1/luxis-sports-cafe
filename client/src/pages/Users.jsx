import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import socket from '../socket';
import { UserPlus, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../useAuth';

const roleLabels = {
  SUPER_ADMIN: 'Super Admin',
  SECONDARY_ADMIN: 'Secondary Admin',
  VIEWER: 'Viewer',
};

const roleBadge = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  SECONDARY_ADMIN: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-gray-100 text-gray-600',
};

function UserForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VIEWER' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/users', form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create user.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-brand">Add User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className={inputClass} required minLength={8} />
            <p className="text-xs text-gray-400 mt-1">At least 8 characters.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={(e) => update('role', e.target.value)} className={inputClass}>
              <option value="VIEWER">Viewer</option>
              <option value="SECONDARY_ADMIN">Secondary Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-60">
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    api
      .get('/users')
      .then((res) => setUsers(res.data))
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false));
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove user.');
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

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand">Users</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition"
        >
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {loading ? (
        <p className="text-gray-500">Loading users…</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.name}
                      {u.id === currentUser?.id && <span className="text-xs text-gray-400 ml-2">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role?.name] || ''}`}>
                        {roleLabels[u.role?.name] || u.role?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="text-gray-400 hover:text-red-600"
                            aria-label="Remove user"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && <UserForm onClose={() => setShowForm(false)} onSaved={load} />}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove User"
          message={`Remove ${deleteTarget.name} (${deleteTarget.email})? They will lose access immediately.`}
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          working={deleting}
        />
      )}
    </Layout>
  );
}