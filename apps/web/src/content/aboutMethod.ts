import type { Locale } from "../lib/i18n";

export const ABOUT_METHOD: Record<
  Locale,
  { title: string; paragraphs: string[]; author: string }
> = {
  ru: {
    title: "О приложении и методе",
    paragraphs: [
      "Метод «диглот-плетение» (diglot weave) — способ учить язык через чтение, а не через зубрёжку. Берётся текст на языке, который вы уже понимаете полностью, и в него постепенно вплетаются слова из изучаемого языка. Мозг не получает перевод — он угадывает значение нового слова из контекста, точно так же, как ребёнок усваивает родной язык, слушая взрослых, а не читая словарь.",
      "Автором идеи считается лингвист Роббинс Бёрлинг, предложивший её в 1968 году. Ключевой принцип — постепенность. На старте доля иностранных слов невелика, обычно 10–20%, чтобы почти каждое предложение оставалось мгновенно понятным. По мере того как читатель осваивается, доля растёт, и текст сдвигается в сторону изучаемого языка — вплоть до того, что в конце человек читает почти полностью на новом языке.",
      "Вплетаются не случайные слова, а цельные смысловые единицы — с правильными артиклями, падежами и согласованием — в определённом порядке: сначала конкретные существительные, которые легче всего угадать, затем частотные глаголы, потом прилагательные, и в последнюю очередь служебные слова.",
      "Метод хорош тем, что позволяет с первого дня читать настоящий текст, а не адаптированные диалоги — но сам по себе не заменяет всей системы изучения языка и лучше работает вместе с интервальным повторением слов.",
      "Приложение Weave делает этот метод доступным без специальной литературы и методических материалов: оно само подбирает и вплетает слова в истории, регулирует плотность под ваш уровень и позволяет заниматься удобным способом — без поиска редких книг и подготовки материалов вручную.",
    ],
    author: "Автор приложения — Максим С., 2026",
  },
  en: {
    title: "About the app and method",
    paragraphs: [
      "The \"diglot weave\" method is a way to learn a language through reading rather than rote memorization. You start with a text in a language you already fully understand, and words from the language you're learning are gradually woven into it. Your brain doesn't get a translation — it guesses the meaning of the new word from context, the same way a child picks up their native language by listening to adults, not by reading a dictionary.",
      "The idea is credited to linguist Robbins Burling, who proposed it in 1968. The key principle is gradualness. At the start, the share of foreign words is small — typically 10–20% — so that almost every sentence stays instantly understandable. As the reader gets more comfortable, that share grows and the text shifts further toward the target language, until by the end you're reading almost entirely in the new language.",
      "What gets woven in isn't random words but whole meaningful units — with correct articles, cases, and agreement — introduced in a specific order: concrete nouns first, since they're easiest to guess, then high-frequency verbs, then adjectives, and function words last.",
      "The method's strength is that it lets you read real text from day one instead of adapted dialogues — but on its own it doesn't replace a full language-learning system, and works best alongside spaced repetition of vocabulary.",
      "The Weave app makes this method accessible without special books or prepared materials: it picks and weaves the words into stories itself, adjusts the density to your level, and lets you practice in a convenient way — without hunting for rare books or preparing materials by hand.",
    ],
    author: "App author — Maxim S., 2026",
  },
};
