import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Library", icon: "📚", end: true },
  { to: "/progress", label: "Progress", icon: "📈", end: false },
  { to: "/settings", label: "Settings", icon: "⚙️", end: false },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              isActive ? "text-blue-500" : "text-slate-500 dark:text-slate-400"
            }`
          }
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
