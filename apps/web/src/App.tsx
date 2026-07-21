import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LibraryPage } from './pages/LibraryPage'
import { ReaderPage } from './pages/ReaderPage'
import { ProgressPage } from './pages/ProgressPage'
import { SettingsPage } from './pages/SettingsPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { AppLayout } from './components/nav/AppLayout'
import { signIn, useSession } from './lib/authClient'
import { detectLocale, I18nProvider, useT, type Locale } from './lib/i18n'

function SignInScreen() {
  return (
    <I18nProvider locale={detectLocale()}>
      <SignInScreenInner />
    </I18nProvider>
  )
}

function SignInScreenInner() {
  const t = useT()
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
    </div>
  )
}

function App() {
  const { data: session, isPending, refetch } = useSession()

  const needsOnboarding =
    !!session && (!session.user.nativeLanguage || !session.user.targetLanguage)

  return (
    <div className="min-h-svh bg-cream-50 dark:bg-slate-900">
      {isPending ? (
        <div className="flex min-h-svh items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading…
          </p>
        </div>
      ) : !session ? (
        <SignInScreen />
      ) : needsOnboarding ? (
        <OnboardingPage onComplete={() => refetch()} />
      ) : (
        <I18nProvider locale={session.user.nativeLanguage as Locale}>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<LibraryPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="/reader/:storyId" element={<ReaderPage />} />
            </Routes>
          </BrowserRouter>
        </I18nProvider>
      )}
    </div>
  )
}

export default App
