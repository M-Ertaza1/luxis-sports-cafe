import { useState } from 'react';
import Layout from '../components/Layout';
import { Moon, Sun, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../useTheme';
import { useAuth } from '../useAuth';
import api from '../api';

const inputClass =
  'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';

// Reusable password field with a show/hide eye toggle
function PasswordInput({ label, value, onChange, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={`${inputClass} pr-10`}
          required
          minLength={minLength}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function ChangeName() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.put('/users/me/name', { name });
      setSuccess('Name changed. It will fully apply next time you log in.');
      setName('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change name.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
        <User size={16} className="text-brand dark:text-brand-light" />
        Change Name
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Current name: <span className="font-medium text-gray-700 dark:text-gray-200">{user?.name}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </div>
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>}
        {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-lg px-3 py-2">{success}</div>}
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-60">
          {saving ? 'Saving…' : 'Change Name'}
        </button>
      </form>
    </section>
  );
}

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/users/me/password', { currentPassword, newPassword });
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
        <Lock size={16} className="text-brand dark:text-brand-light" />
        Change Password
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Update your account password.</p>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <PasswordInput label="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <PasswordInput label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
        <PasswordInput label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>}
        {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-lg px-3 py-2">{success}</div>}
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-60">
          {saving ? 'Saving…' : 'Change Password'}
        </button>
      </form>
    </section>
  );
}

function ChangeEmail() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.put('/users/me/email', { newEmail, currentPassword });
      setSuccess('Email changed successfully. It will apply next time you log in.');
      setNewEmail('');
      setCurrentPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change email.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
        <Mail size={16} className="text-brand dark:text-brand-light" />
        Change Email
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Current email: <span className="font-medium text-gray-700 dark:text-gray-200">{user?.email}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Email</label>
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} required />
        </div>
        <PasswordInput label="Confirm Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>}
        {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-lg px-3 py-2">{success}</div>}
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-60">
          {saving ? 'Saving…' : 'Change Email'}
        </button>
      </form>
    </section>
  );
}

export default function Settings() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-brand dark:text-brand-light mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-1">Appearance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how the app looks.</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              {isDark ? <Moon size={18} /> : <Sun size={18} />}
              <span className="text-sm">{isDark ? 'Dark mode' : 'Light mode'}</span>
            </div>
            <button
              onClick={toggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-brand' : 'bg-gray-300'}`}
              aria-label="Toggle dark mode"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : ''}`}
              />
            </button>
          </div>
        </section>

        <ChangeName />
        <ChangePassword />
        <ChangeEmail />
      </div>
    </Layout>
  );
}