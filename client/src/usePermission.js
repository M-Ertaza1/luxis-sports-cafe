import { useAuth } from './useAuth';
import { can } from './permissions';

export function usePermission() {
  const { user } = useAuth();
  return (permission) => can(user?.role, permission);
}