import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ShieldCheckIcon, 
  ClipboardDocumentCheckIcon,
  DocumentTextIcon, 
  ClipboardDocumentListIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useUserRole } from '../common/RoleGuard';

const primaryNavItems = [
  { id: 'dashboard', label: 'Home', icon: HomeIcon, path: '/dashboard' },
  { id: 'patrol', label: 'Patrol', icon: ShieldCheckIcon, path: '/patrol' },
  { id: 'ptw', label: 'PTW', icon: DocumentTextIcon, path: '/ptw' },
  { id: 'toolbox', label: 'Toolbox', icon: ClipboardDocumentListIcon, path: '/toolbox' },
  { id: 'members', label: 'Members', icon: UserGroupIcon, path: '/admin/members' },
];

// Admin-only navigation items (visible to both admin and system_admin)
const adminNavItems = [
  { id: 'admin-users', label: 'Users', icon: UsersIcon, path: '/users' },
  { id: 'admin-audit', label: 'Audit', icon: ClipboardDocumentCheckIcon, path: '/audit' },
];

// System admin-only navigation items
const systemAdminNavItems = [
  { id: 'admin-form-config', label: 'Forms', icon: Cog6ToothIcon, path: '/admin/project-form-config' },
  { id: 'admin-system', label: 'System', icon: WrenchScrewdriverIcon, path: '/admin/system' },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { isSystemAdmin, isAdmin } = useUserRole();

  // Combine navigation items based on role
  const allNavItems = [
    ...primaryNavItems, 
    ...(isAdmin ? adminNavItems : []),
    ...(isSystemAdmin ? systemAdminNavItems : [])
  ];
  
  // Check if we have many items that might need scrolling on very small screens
  const hasMultipleItems = allNavItems.length > 4;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden">
      <div className="relative">
        {/* Responsive container: full width when enough space, scrollable when compressed */}
        <div className={`
          flex px-2 py-1
          ${hasMultipleItems 
            ? 'justify-between overflow-x-auto scrollbar-hide' 
            : 'justify-between'
          }
        `}>
          {allNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center py-2 px-2 text-xs rounded-lg transition-colors duration-200
                  ${hasMultipleItems 
                    ? 'flex-1 min-w-16' 
                    : 'flex-1'
                  }
                  ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
                `}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className={`text-center leading-none sm:leading-tight ${hasMultipleItems ? 'truncate' : 'truncate'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* Add padding for scrolling when content overflows */}
          {hasMultipleItems && (
            <div className="flex-shrink-0 w-2"></div>
          )}
        </div>
        
        {/* Gradient indicators when scrolling is available */}
        {hasMultipleItems && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          </>
        )}
      </div>
    </div>
  );
};
