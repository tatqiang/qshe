import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon,
  UserPlusIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useUserRole } from '../common/RoleGuard';
import type { NavigationItem } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'HomeIcon', path: '/dashboard' },
  { id: 'patrol', label: 'Safety Patrol', icon: 'ShieldCheckIcon', path: '/patrol' },
  { id: 'ptw', label: 'Permit to Work', icon: 'DocumentTextIcon', path: '/ptw' },
  { id: 'toolbox', label: 'Toolbox Meetings', icon: 'ClipboardDocumentListIcon', path: '/toolbox' },
  { id: 'users', label: 'Users', icon: 'UsersIcon', path: '/users' },
];

// Admin-only navigation items
const adminNavigationItems: NavigationItem[] = [
  { id: 'admin-system', label: 'System Settings', icon: 'WrenchScrewdriverIcon', path: '/admin/system' },
];

const iconMap = {
  HomeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  UserPlusIcon,
  WrenchScrewdriverIcon,
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isSystemAdmin, user, role } = useUserRole();

  // Debug logging
  console.log('Sidebar - user:', user);
  console.log('Sidebar - role:', role);
  console.log('Sidebar - isSystemAdmin:', isSystemAdmin);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.svg" 
              alt="QSHE Logo" 
              className="h-8 w-8"
            />
            <h1 className="text-xl font-bold text-white">QSHE</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = iconMap[item.icon as keyof typeof iconMap];
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}

            {/* Admin-only navigation items */}
            {isSystemAdmin && (
              <>
                <div className="mt-6 mb-3 px-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </h3>
                </div>
                {adminNavigationItems.map((item) => {
                  const IconComponent = iconMap[item.icon as keyof typeof iconMap];
                  const isActive = location.pathname.startsWith(item.path);
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => onClose()}
                      className={`
                        flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                        ${isActive 
                          ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <IconComponent className="w-5 h-5 mr-3" />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};
