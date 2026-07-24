import { NavLink } from "react-router-dom";
import { LibraryIcon, VocabularyIcon, SettingsIcon } from "./icons";
import { useT } from "../../lib/i18n";

export function BottomNav() {
  const t = useT();
  const TABS = [
    { to: "/", label: t.library, Icon: LibraryIcon, end: true },
    { to: "/progress", label: t.vocabularyTab, Icon: VocabularyIcon, end: false },
    { to: "/settings", label: t.settings, Icon: SettingsIcon, end: false },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md border-t border-cream-100 bg-cream-50/95 backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] text-xs font-medium ${
              isActive
                ? "text-stone-900 dark:text-slate-100"
                : "text-stone-400 dark:text-slate-500"
            }`
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
