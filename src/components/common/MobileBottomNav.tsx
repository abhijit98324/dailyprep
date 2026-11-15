import { NavLink } from 'react-router-dom';
import { BookOpenCheck, Clock, LayoutDashboard, Newspaper, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileBottomNav() {
  const { user } = useAuth();
  if (!user) return null;

  const tabs = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/daily-quiz', label: 'Quiz', icon: BookOpenCheck },
    { to: '/mock-tests', label: 'Mocks', icon: Clock },
    { to: '/current-affairs', label: 'Affairs', icon: Newspaper },
    { to: '/admin', label: 'Admin', icon: ShieldCheck },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800"
    >
      <div className="grid grid-cols-5 items-center h-14">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                isActive
                  ? 'text-blue-700 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}