import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LibraryPage } from './pages/LibraryPage'
import { ReaderPage } from './pages/ReaderPage'
import { signIn, useSession } from './lib/authClient'

function SignInScreen() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Weave
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sign in to start reading.
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
        className="rounded-xl bg-blue-500 px-6 py-3 font-medium text-white active:bg-blue-600"
      >
        Sign in with Google
      </button>
    </div>
  )
}

function App() {
  const { data: session, isPending } = useSession()

  return (
    <div className="min-h-svh bg-slate-50 dark:bg-slate-900">
      {isPending ? (
        <div className="flex min-h-svh items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading…
          </p>
        </div>
      ) : !session ? (
        <SignInScreen />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/reader/:storyId" element={<ReaderPage />} />
          </Routes>
        </BrowserRouter>
      )}
    </div>
  )
}

export default App
