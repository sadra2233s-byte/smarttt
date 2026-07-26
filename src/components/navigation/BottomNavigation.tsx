import React from 'react';
import { CheckSquare, Flame, CalendarDays, Wallet } from 'lucide-react';

export type PageTab = 'tasks' | 'habits' | 'daily' | 'financial';

interface BottomNavigationProps {
  activeTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  taskCount?: number;
  habitCount?: number;
  dailyCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  taskCount = 0,
  habitCount = 0,
  dailyCount = 0,
}) => {
  const tabs = [
    {
      id: 'tasks' as PageTab,
      label: 'ردیاب وظایف و اهداف',
      shortLabel: 'وظایف',
      icon: CheckSquare,
      count: taskCount,
      activeColor: 'bg-teal-700 text-white shadow-lg shadow-teal-700/20',
      inactiveColor: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    },
    {
      id: 'habits' as PageTab,
      label: 'عادات روزانه',
      shortLabel: 'عادات',
      icon: Flame,
      count: habitCount,
      activeColor: 'bg-indigo-700 text-white shadow-lg shadow-indigo-700/20',
      inactiveColor: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    },
    {
      id: 'daily' as PageTab,
      label: 'کارهای روزانه',
      shortLabel: 'روزانه',
      icon: CalendarDays,
      count: dailyCount,
      activeColor: 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/20',
      inactiveColor: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    },
    {
      id: 'financial' as PageTab,
      label: 'مالی و بودجه',
      shortLabel: 'مالی',
      icon: Wallet,
      count: undefined,
      activeColor: 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-700/30',
      inactiveColor: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl py-2 px-3">
      <div className="max-w-4xl mx-auto grid grid-cols-4 gap-1 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 rounded-2xl transition-all duration-300 ${
                isActive ? tab.activeColor : tab.inactiveColor
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />

              <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap truncate">
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="inline sm:hidden">{tab.shortLabel}</span>
              </span>

              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`hidden xs:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
