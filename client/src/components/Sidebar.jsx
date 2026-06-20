import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Package,
  ChefHat,
  ShoppingCart,
  ScrollText,
  Users as UsersIcon,
  DollarSign,
} from 'lucide-react';
import { usePermission } from '../usePermission';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/kitchen', label: 'Kitchen', icon: ChefHat },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/activity', label: 'Activity Log', icon: ScrollText },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
    isActive
      ? 'bg-white/15 text-white'
      : 'text-white/70 hover:bg-white/10 hover:text-white'
  }`;

export default function Sidebar({ open, onClose }) {
  const allow = usePermission();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static z-30 top-0 left-0 h-full w-64 bg-brand text-white flex flex-col transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
          <img src="/luxis_crest.png" alt="Luxis Sports Café" className="h-10 w-auto" />
          <div>
            <div className="text-lg font-bold leading-tight">LUXIS</div>
            <div className="text-[10px] text-white/60 tracking-wide">SPORTS CAFÉ</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={onClose} className={linkClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {allow('user.read') && (
            <NavLink to="/users" onClick={onClose} className={linkClass}>
              <UsersIcon size={18} />
              Users
            </NavLink>
          )}

          {allow('arena.update') && (
            <NavLink to="/arenas" onClick={onClose} className={linkClass}>
              <DollarSign size={18} />
              Arenas & Pricing
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  );
}