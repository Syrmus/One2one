import { Link } from "react-router-dom";
import { useT, type Locale } from "../lib/i18n";
import { ABOUT_METHOD } from "../content/aboutMethod";

export function AboutPage({ locale }: { locale: Locale }) {
  const t = useT();
  const { title, paragraphs, author } = ABOUT_METHOD[locale];

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link
        to="/"
        className="mb-4 inline-block text-sm text-dusk-600 dark:text-dusk-500"
      >
        {t.back}
      </Link>

      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        {title}
      </h1>

      <div className="flex flex-col gap-4">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-sm leading-relaxed text-slate-700 dark:text-slate-300"
          >
            {p}
          </p>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">{author}</p>

      <img
        src="/cat-mascot.png"
        alt=""
        className="mx-auto mt-4 w-32 opacity-90"
      />
    </div>
  );
}
