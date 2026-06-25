import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/activity', label: 'System Activity', icon: Activity },
];

export const NavBar = () => {
  const location = useLocation();

  return (
    <nav className="glass-card" style={{ 
      display: 'flex', 
      gap: '8px', 
      marginBottom: '32px',
      padding: '8px',
      justifyContent: 'center',
      alignItems: 'center',
      width: 'fit-content',
      margin: '0 auto 32px auto'
    }}>
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path || (path === '/' && location.pathname === '');

        return (
          <NavLink 
            key={path}
            to={path} 
            className="nav-link"
            style={{ position: 'relative', zIndex: 1, color: isActive ? 'var(--text-main)' : 'var(--text-muted)' }}
          >
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  zIndex: -1
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Icon size={20} />
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
};
