import { signOut, useSession } from "../lib/authClient";

export function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        Settings
      </h1>

      {session && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {session.user.name ?? session.user.email}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {session.user.email}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => signOut()}
        className="w-full rounded-xl border border-red-200 py-3 text-center font-medium text-red-600 dark:border-red-900 dark:text-red-400"
      >
        Sign out
      </button>
    </div>
  );
}
