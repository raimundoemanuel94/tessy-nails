"use client";

interface AppointmentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts?: {
    upcoming: number;
    history: number;
    all: number;
  };
}

export function AppointmentTabs({ activeTab, onTabChange, counts }: AppointmentTabsProps) {
  const tabs = [
    { id: 'upcoming', label: 'Próximos', icon: '📅' },
    { id: 'history', label: 'Histórico', icon: '📋' },
    { id: 'all', label: 'Todos', icon: '📚' }
  ];

  return (
    <div className="mb-6">
      <div className="border-b border-violet-100">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = counts?.[tab.id as keyof typeof counts] || 0;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative py-4 px-1 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className="bg-violet-100 text-violet-600 rounded-full px-2 py-1 text-xs font-semibold">
                      {count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
