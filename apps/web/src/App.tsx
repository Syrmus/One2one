import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { LibraryPage } from './pages/LibraryPage'
import { ReaderPage } from './pages/ReaderPage'
import { ProgressPage } from './pages/ProgressPage'
import { SettingsPage } from './pages/SettingsPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { AboutPage } from './pages/AboutPage'
import { AppLayout } from './components/nav/AppLayout'
import { BottomNav } from './components/nav/BottomNav'
import { signIn, useSession } from './lib/authClient'
import { detectLocale, I18nProvider, useT, type Locale } from './lib/i18n'
import { useLocaleStore } from './store/localeStore'

function SignInScreen() {
  const storedLocale = useLocaleStore((s) => s.locale)
  const locale = storedLocale ?? detectLocale()
  return (
    <I18nProvider locale={locale}>
      <SignInScreenInner />
    </I18nProvider>
  )
}

function SignInScreenInner() {
  const t = useT()
  const storedLocale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  const locale = storedLocale ?? detectLocale()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <img src="/cat-mascot.png" alt="" className="w-56" />
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t.appName}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t.signInSubtitle}
        </p>
      </div>
      <button
        type="button"
        onClick={() =>
          signIn.social({
            provider: 'google',
            callbackURL: window.location.origin + '/',
          })
        }
        className="rounded-2xl bg-dusk-500 px-6 py-3 font-medium text-white active:bg-dusk-600"
      >
        {t.signInWithGoogle}
      </button>

      <Link to="/about" className="text-sm text-dusk-600 dark:text-dusk-500">
        {t.aboutMethodLink}
      </Link>

      <div className="flex gap-2">
        {(['en', 'ru'] as Locale[]).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              locale === code
                ? 'bg-sage-500 text-white'
                : 'bg-cream-100 text-stone-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {code === 'ru' ? 'Русский' : 'English'}
          </button>
        ))}
      </div>
    </div>
  )
}

function AboutRoute() {
  const { data: session } = useSession()
  const storedLocale = useLocaleStore((s) => s.locale)
  const locale =
    (session?.user.nativeLanguage as Locale | undefined) ??
    storedLocale ??
    detectLocale()
  return (
    <I18nProvider locale={locale}>
      {session ? (
        <>
          <div className="pb-20">
            <AboutPage locale={locale} />
          </div>
          <BottomNav />
        </>
      ) : (
        <AboutPage locale={locale} />
      )}
    </I18nProvider>
  )
}

function MainApp() {
  const { data: session, isPending, refetch } = useSession()

  const needsOnboarding =
    !!session && (!session.user.nativeLanguage || !session.user.targetLanguage)

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    )
  }

  if (!session) return <SignInScreen />
  if (needsOnboarding) return <OnboardingPage onComplete={() => refetch()} />

  return (
    <I18nProvider locale={session.user.nativeLanguage as Locale}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reader/:storyId" element={<ReaderPage />} />
        </Route>
      </Routes>
    </I18nProvider>
  )
}

function App() {
  return (
    <div className="min-h-svh bg-cream-50 dark:bg-slate-900">
      <BrowserRouter>
        <Routes>
          <Route path="/about" element={<AboutRoute />} />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
