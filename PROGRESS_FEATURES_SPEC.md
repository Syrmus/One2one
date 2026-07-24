# Weave — ТЗ: прогресс и мотивация (этап 1)

Рабочий контракт на три фичи из рецензии по прогрессу. Область — минимально
инвазивные изменения, не создающие очковой экономики. Порядок разделов = порядок
имплементации.

## Принятые решения по спорным местам

Зафиксировано после прогона спорных мест (см. также §6 — вне области):

1. **Статус «Прочитана» требует ненулевой плотности (шаг ≥ 1).** Дочитывание на
   0% (чистый L1, ничего не вплетено) не меняет статус и не показывает экран
   завершения. Как в рецензии §2 («на любой ненулевой плотности»).
2. **3-й шаг дневной цели — «Добавить 5 слов».** Работает на существующих данных
   (`addedAt`), без нового логирования. Цель — 3 шага.
3. **«Прочитано: X%» реализуем** — через **якоря по предложениям** (не по
   абзацам: в контенте историй абзацев нет, см. §2.1). Новая колонка
   `maxReadPercent`.
4. **Экран завершения показывается только на новой максимальной плотности** —
   когда история дочитана на шаге выше, чем когда-либо ранее (`step > prevMax`).
   Повторный скролл на той же плотности экран не открывает; подъём плотности и
   перечитывание — открывает.

Затрагиваемые сущности (сводка):

| Слой | Изменения |
|------|-----------|
| `apps/api/src/db/schema.ts` | +3 колонки в `readingProgress` |
| `apps/api/src/routes/readingProgress.ts` | новый `POST /completed`, `readPercent` в `POST /`, отдача новых полей |
| `apps/web/src/lib/api.ts` | `postStoryCompleted`, `readPercent` в `postReadingProgress`, расширить `ReadingProgressRow` |
| `apps/web/src/store/readerStore.ts` | 3 новых map + `markReachedEnd`/`setReadPercent`, гидрация |
| `apps/web/src/lib/progress.ts` | `storyStatus()`, `isToday()`, `dailyGoal()` |
| `apps/web/src/lib/sentences.ts` (новый) | `splitIntoSentences(units)` — группировка units в предложения |
| `apps/web/src/components/reader/WeaveText.tsx` | обёртка предложений в якорные `<span>` + `IntersectionObserver` |
| `apps/web/src/pages/ReaderPage.tsx` | приём «дошёл до конца»/`readPercent`, вызов экрана завершения |
| Новые компоненты | `StoryCompletionScreen`, `StoryStatusBadge`, `DailyGoalCard` |
| `apps/web/src/components/library/StoryCard.tsx` | статус + макс. плотность + прочитано % |
| `apps/web/src/lib/i18n.tsx` | новые строки (en/ru) |

Общие принципы:
- Никаких очков/XP. Мотивация = ясность статуса и явный следующий шаг.
- «Сегодня» = локальная полночь пользователя (`new Date().setHours(0,0,0,0)`).
- Все серверные записи — fire-and-forget (как существующие `postSeen` и т.п.);
  localStorage-стор остаётся источником мгновенной правды, сервер догоняет.

---

## Часть 0. Изменения данных (общий фундамент для §1 и §2)

### 0.1. Схема

В `readingProgress` ([schema.ts](apps/api/src/db/schema.ts)) добавить:

```ts
reachedEndAt: timestamp("reached_end_at", { withTimezone: true }), // nullable
maxCompletedStep: integer("max_completed_step").notNull().default(0),
maxReadPercent: integer("max_read_percent").notNull().default(0),
```

- `reachedEndAt` — момент, когда пользователь докрутил историю до конца **на
  плотности ≥ 1** (последнее такое событие; для «дочитал сегодня» достаточно).
  Дочитывание на шаге 0 сюда не пишется.
- `maxCompletedStep` — максимальный `densityStep`, **на котором история была
  дочитана до конца** (всегда ≥ 1, т.к. на шаге 0 событие не пишется).
  Обновляется только в событии «дошёл до конца», не при изменении ползунка.
  Отсюда: `maxCompletedStep === MAX_STEP` ⇔ дочитана на 100%; `>= 1` ⇔ прочитана.
- `maxReadPercent` — самая дальняя достигнутая позиция чтения, % (по якорям
  предложений, §2.1). Монотонно растёт (GREATEST). Для строки «Прочитано: X%»
  на карточке.

Существующий `densityStep` остаётся «последней выбранной плотностью» (может быть
ниже макс.) — не трогаем. `scrollPosition` (пиксели) остаётся для восстановления
позиции скролла — это не то же самое, что `maxReadPercent`.

Миграция: сгенерировать через `pnpm --filter api db:generate` (drizzle-kit,
папка `apps/api/drizzle/`, применяется автоматически в `start`-скрипте через
`migrate.ts`). Все три колонки безопасны для существующих строк (nullable / default 0).

### 0.2. API

`readingProgress.ts` ([route](apps/api/src/routes/readingProgress.ts)):

1. `GET /` уже отдаёт всю строку — новые поля поедут автоматически.
2. Расширить существующий `POST /` — принять необязательный `readPercent` и
   поднимать `maxReadPercent` через GREATEST:
   ```ts
   set: { densityStep, scrollPosition,
          maxReadPercent: sql`GREATEST(${readingProgress.maxReadPercent}, ${readPercent ?? 0})`,
          updatedAt: sql`now()` }
   ```
   (в `values(...)` добавить `maxReadPercent: readPercent ?? 0`).
3. Новый эндпоинт:

```
POST /api/reading-progress/completed
body: { storyId: string, densityStep: number }   // densityStep >= 1
```

Логика (upsert с GREATEST, строка всегда уже существует, но подстрахуемся insert'ом):

```ts
.insert(readingProgress)
.values({ userId, storyId, densityStep, scrollPosition: 0,
          reachedEndAt: sql`now()`, maxCompletedStep: densityStep })
.onConflictDoUpdate({
  target: [readingProgress.userId, readingProgress.storyId],
  set: {
    reachedEndAt: sql`now()`,
    maxCompletedStep: sql`GREATEST(${readingProgress.maxCompletedStep}, ${densityStep})`,
    updatedAt: sql`now()`,
  },
})
```

Валидация: `storyId` строка, `densityStep` число в `[1, MAX_STEP]` (шаг 0
отвергать 400 — клиент и так не должен слать, но серверная гарантия статуса).

### 0.3. Клиент — api.ts

- Расширить `ReadingProgressRow`: `reachedEndAt: string | null; maxCompletedStep: number; maxReadPercent: number;`
- `postReadingProgress(storyId, densityStep, scrollPosition, readPercent?)` — добавить
  4-й необязательный аргумент `readPercent`, прокинуть в тело запроса.
- Добавить:

```ts
export async function postStoryCompleted(storyId: string, densityStep: number): Promise<void>
```
(тело как у `postReadingProgress`, POST на `/api/reading-progress/completed`, try/catch + console.error).

### 0.4. Клиент — readerStore

Добавить в состояние:

```ts
reachedEndByStory: Record<string, number>;       // storyId -> ts (Date.now при событии)
maxCompletedStepByStory: Record<string, number>; // storyId -> макс. плотность дочитывания
maxReadPercentByStory: Record<string, number>;   // storyId -> самая дальняя позиция чтения, %
```

Экшены:

```ts
// Возвращает true, если это дочитывание на НОВОЙ макс. плотности (step > prevMax) —
// ReaderPage по этому флагу решает, показывать ли экран завершения (решение §4).
markReachedEnd: (storyId: string, step: number) => boolean;
setReadPercent: (storyId: string, percent: number) => void;
```

`markReachedEnd(storyId, step)`:
- **если `step < 1` — ничего не делать, вернуть `false`** (дочитывание на 0% не
  засчитывается, решение §1);
- `const prevMax = maxCompletedStepByStory[storyId] ?? 0; const isNewMax = step > prevMax;`
- ставит `reachedEndByStory[storyId] = Date.now()`;
- `maxCompletedStepByStory[storyId] = Math.max(prevMax, step)`;
- `void postStoryCompleted(storyId, step)`;
- `return isNewMax`.

`setReadPercent(storyId, percent)`:
- `maxReadPercentByStory[storyId] = Math.max(prev ?? 0, percent)` (монотонно);
- шлёт на сервер тем же дебаунс-каналом, что и скролл — расширить
  `scheduleScrollSync`, чтобы передавать `readPercent` в `postReadingProgress`
  (не заводить отдельный таймер).

Гидрация (`hydrateFromServer`): для каждой `readingRows`-строки, если поле ещё не
в локальной map — заполнить `reachedEndByStory` (из `Date.parse(row.reachedEndAt)`,
если не null), `maxCompletedStepByStory` (из `row.maxCompletedStep`) и
`maxReadPercentByStory` (из `row.maxReadPercent`). Правило «не перетирать локальное» —
как уже сделано для `densityByStory`/`scrollByStory`.

Новые map попадают в `partialize` (persist) — по умолчанию попадут, т.к.
исключаются только `hydrated`/`milestoneToast`.

---

## Часть 1. Статусы истории (§2 рецензии) — 3 статуса

### 1.1. Определение статуса

Хелпер в [progress.ts](apps/web/src/lib/progress.ts):

```ts
export type StoryStatus = "unopened" | "started" | "read" | "woven";

export function storyStatus(args: {
  hasProgress: boolean;      // есть строка readingProgress (открывал/менял плотность/скроллил)
  maxCompletedStep: number;  // maxCompletedStepByStory[id] ?? 0
}): StoryStatus
```

Правила (сверху вниз, первое подошедшее):
- `maxCompletedStep === MAX_STEP` → **`woven`** (Вплетена ◉)
- `maxCompletedStep >= 1` → **`read`** (Прочитана ◐)
- `hasProgress` → **`started`** (Начата ◌)
- иначе → **`unopened`** (без бейджа)

`maxCompletedStep` уже гарантированно ≥ 1 только при дочитывании на ненулевой
плотности (решение §1), поэтому `reachedEnd` как отдельный признак статуса не
нужен — статус выводится из одного `maxCompletedStep`. `reachedEndAt`/
`reachedEndByStory` остаются только для дневной цели «дочитал сегодня».

`hasProgress` для стора: `story.id in densityByStory || story.id in scrollByStory`.

> Статус «Освоена» (✦) из рецензии **не реализуется на этом этапе**: он завязан
> на подтверждение ключевых слов истории тестом. Инфраструктура для этого есть
> (`/quiz/story/:id`), но нужно логировать результаты пер-историйного квиза —
> это отдельная задача (word-mastery), вне области этого ТЗ.

### 1.2. Компонент бейджа

`apps/web/src/components/library/StoryStatusBadge.tsx`:
- вход: `status: StoryStatus`;
- рендер: глиф + подпись. `unopened` → `null`.
- Глифы: `◌` started, `◐` read, `◉` woven. Цвет: started — stone/slate-400,
  read — sage-500, woven — dusk-600 (в тон существующей палитре карточек).
- Подписи — из i18n (`storyStatusStarted/Read/Woven`).

### 1.3. StoryCard

[StoryCard.tsx](apps/web/src/components/library/StoryCard.tsx) переработать в
компактный блок из рецензии. Данные брать из стора (селекторами) по `story.id`.

Макет карточки:
```
{title}
{level} · {N слов}                       [StoryStatusBadge]
─ прогресс-бар «освоено слов» (существующий storyProgress.ratio) ─
Прочитано: {readPercent}%  ·  Макс. плотность: {maxTarget}%  ·  Освоено слов: {seen}/{total}
```
- `readPercent` = `maxReadPercentByStory[story.id] ?? 0` (решение §3).
- `maxTarget` = `DEFAULT_STEPS[maxStep].target` (0% если не дочитано ни разу).
- Строку «Освоено слов» оставляем на существующем `storyProgress` (seen/total лемм).

Селекторы в StoryCard:
```ts
const maxStep = useReaderStore((s) => s.maxCompletedStepByStory[story.id] ?? 0);
const readPercent = useReaderStore((s) => s.maxReadPercentByStory[story.id] ?? 0);
const hasProgress = useReaderStore((s) => story.id in s.densityByStory || story.id in s.scrollByStory);
```

---

## Часть 2. Экран завершения истории (§11 рецензии)

### 2.1. Якоря предложений, `readPercent` и детекция конца

**Контекст (важно):** [WeaveText.tsx](apps/web/src/components/reader/WeaveText.tsx)
рендерит все `story.units` одним плоским `<p>`. Абзацев в контенте нет — во всех
41 seed-историях в text-units нет переносов строк. Поэтому «якоря абзацев» из
решения §3 реализуются как **якоря по предложениям** (та же техника
`IntersectionObserver`, но гранулярность — предложение; для историй ~120–150 слов
это ~10–15 якорей, чего достаточно и для %-прогресса, и для детекции конца).

**Хелпер** `apps/web/src/lib/sentences.ts`:
```ts
type Sentence = { units: { unit: StoryUnit; index: number }[] };
export function splitIntoSentences(units: StoryUnit[]): Sentence[]
```
- идёт по units по порядку, накапливая в текущее предложение; граница —
  text-unit, чей `l1` содержит завершающую пунктуацию `.!?…` (пунктуация
  остаётся в конце текущего предложения);
- **сохраняет исходный глобальный `index`** каждого unit — он нужен
  `onSelectWeave(index)`, который завязан на позицию в `story.units`.

**WeaveText** переписать так, чтобы рендерить предложения как inline-якоря:
```tsx
<p className="…">
  {sentences.map((s, si) => (
    <span key={si} ref={setSentenceRef(si)}>
      {s.units.map(({ unit, index }) => /* прежний рендер span/button по index */)}
    </span>
  ))}
</p>
```
- визуально ничего не меняется (inline `<span>` не разрывает поток абзаца);
- прежняя логика `computeRevealedIndices`/`isWoven`/`onSelectWeave(index)` —
  без изменений, только теперь вложена в обёртку предложения;
- новый проп `onProgress(furthestSentenceIdx: number, total: number)`.

**IntersectionObserver** внутри WeaveText: наблюдает каждый якорь предложения;
хранит `maxSeenIdx` (самый дальний предложенный индекс, чей верх пересёк
вьюпорт). При росте `maxSeenIdx` — `onProgress(maxSeenIdx, total)`.

**ReaderPage** (обработчик `onProgress`):
1. `percent = Math.round(((furthest + 1) / total) * 100)`;
2. `setReadPercent(story.id, percent)`;
3. **если `furthest === total - 1` (последнее предложение = конец)** — это
   «дошёл до конца». Guard `reachedGuardRef = useRef<Set<string>>` по ключу
   `${story.id}:${step}` (одно срабатывание на пару история+шаг за монтирование,
   от дрожания скролла):
   - `const isNewMax = markReachedEnd(story.id, step);`
   - **экран завершения открывать только если `isNewMax === true`** (решение §4;
     `markReachedEnd` уже вернёт `false` для `step < 1`, так что 0% отсеивается
     автоматически) → `setCompletionOpen(true)`.

Отдельный `endSentinelRef` не нужен — последний якорь предложения и есть конец.

Короткая история, помещающаяся на экран целиком: последний якорь пересекает
вьюпорт сразу → считается дочитанной. Это корректно (весь текст виден). Экран
покажется один раз (guard + `isNewMax`).

### 2.2. Компонент StoryCompletionScreen

`apps/web/src/components/reader/StoryCompletionScreen.tsx` — модальный оверлей
(затемнение + карточка снизу, в стиле существующих скруглений `rounded-3xl`).

Props:
```ts
{
  story: Story;
  step: number;                 // плотность, на которой дочитано
  seen: number; total: number;  // из storyProgress
  addedInStory: number;         // сколько лемм истории added
  canRaiseDensity: boolean;     // step < MAX_STEP
  canQuiz: boolean;             // buildStoryQuizPairs(story).length >= 5
  onRaiseDensity: () => void;
  onQuiz: () => void;
  onNext: () => void;           // следующая история / в библиотеку
  onClose: () => void;
}
```

Содержимое (только данные, которые реально есть):
```
История прочитана
Плотность: {DEFAULT_STEPS[step].target}%
Слов в истории: {total}
Встречено из них: {seen}
Добавлено в словарь: {addedInStory}
```
> Секцию «Освоено в этой сессии / Нити +N» из рецензии **не делаем**: нет
> понятия сессии и нет очков. Показываем накопительные по истории числа.

Кнопки (CTA-приоритет сверху вниз):
1. `canRaiseDensity` → **«Прочитать на большей плотности»** → `onRaiseDensity`:
   `setDensity(story.id, step + 1)`, `window.scrollTo(0,0)`, закрыть оверлей.
2. `canQuiz` → **«Проверить слова»** → `navigate('/quiz/story/'+story.id)`.
3. Всегда → **«Следующая история»** → `onNext` (см. 2.3).
4. Крестик/тап по фону → `onClose`.

Если `!canRaiseDensity && !canQuiz` — остаётся только «Следующая история», это
нормальный терминальный экран.

### 2.3. «Следующая история»

Минимальная версия для этапа 1: `onNext` = переход в библиотеку (`navigate('/')`).
Умный подбор «следующей истории того же уровня» вынести в расширение (для него
на ReaderPage нет списка историй; тянуть `getStories` только ради этого —
избыточно на этом этапе). Зафиксировать как TODO.

### 2.4. Вычисление `addedInStory`

В ReaderPage: по `storyLemmas(story)` (уже есть в progress.ts) отфильтровать
`vocabulary[\`${story.l2}:${lemma}\`]?.added`.

---

## Часть 3. Ежедневная цель (§6 рецензии)

Без новой таблицы — всё из существующего клиентского состояния.

### 3.1. Хелперы (progress.ts)

```ts
export function isToday(ts: number): boolean; // ts >= локальная полночь

export type DailyGoal = {
  readStory: boolean;   // сегодня дочитана хотя бы одна история
  metWords: boolean;    // сегодня впервые встречено >= NEW_WORDS_TARGET слов
  addedWords: boolean;  // сегодня добавлено >= ADD_WORDS_TARGET слов
  done: number;         // сколько из 3 выполнено
};

export const NEW_WORDS_TARGET = 5;
export const ADD_WORDS_TARGET = 5;
```

Вычисление `dailyGoal(vocabulary, reachedEndByStory, targetLang)`:
- `readStory` = какой-либо `reachedEndByStory[*]` попадает в `isToday`.
  (Ограничение: `reachedEndAt` хранит только последнее событие — если сегодня
  дочитал, потом ещё раз другую — флаг всё равно true. Для «выполнено да/нет»
  этого достаточно.)
- `metWords` = число записей словаря (для `targetLang`) с `isToday(firstSeenAt)` ≥ 5.
- `addedWords` = число записей с `e.added && isToday(e.addedAt ?? 0)` ≥ 5.

> `addedAt` — local-only (не синхронизируется), как отмечено в readerStore. Для
> дневной цели это ок: цель — про «сегодня на этом устройстве».

### 3.2. Компонент DailyGoalCard

`apps/web/src/components/library/DailyGoalCard.tsx`:
```
Цель на сегодня: {done} из 3
[✓/◌] Прочитать одну историю
[✓/◌] Встретить 5 новых слов
[✓/◌] Добавить 5 слов
```
- Галочка `✓` (sage-500) для выполненного, `◌` (stone-400) для нет.
- Если `done === 3` — заголовок «Цель на сегодня выполнена ✓» (без давления, без
  наказаний — в духе рецензии §7).
- Стиль карточки — как `WeeklySummary` (rounded-2xl border cream/slate).

### 3.3. Размещение

В [LibraryPage.tsx](apps/web/src/pages/LibraryPage.tsx) **над** `<WeeklySummary>`:
```tsx
<DailyGoalCard targetLanguage={targetLanguage} />
<WeeklySummary targetLanguage={targetLanguage} />
```
Домашний экран приложения — библиотека, поэтому цель видна при входе.

> Пресеты сложности (лёгкий/обычный/интенсивный из §6) в этап 1 **не входят** —
> фиксированная цель из 3 шагов. Пресеты = расширение (потребуют хранения выбора
> в настройках).

---

## Часть 4. i18n

Новые ключи в обоих словарях (`en`, `ru`) [i18n.tsx](apps/web/src/lib/i18n.tsx):

| Ключ | ru | en |
|------|----|----|
| `storyStatusStarted` | Начата | Started |
| `storyStatusRead` | Прочитана | Read |
| `storyStatusWoven` | Вплетена | Woven |
| `storyReadPercent(pct)` | Прочитано: {pct}% | Read: {pct}% |
| `storyMaxDensity(pct)` | Макс. плотность: {pct}% | Max density: {pct}% |
| `storyMasteredWords(seen,total)` | Освоено слов: {seen}/{total} | Words: {seen}/{total} |
| `completionTitle` | История прочитана | Story finished |
| `completionDensity(pct)` | Плотность: {pct}% | Density: {pct}% |
| `completionTotalWords(n)` | Слов в истории: {n} | Words in story: {n} |
| `completionSeen(n)` | Встречено из них: {n} | Encountered: {n} |
| `completionAdded(n)` | Добавлено в словарь: {n} | Added to vocabulary: {n} |
| `completionRaiseDensity` | Прочитать на большей плотности | Read at higher density |
| `completionQuiz` | Проверить слова | Test the words |
| `completionNext` | Следующая история | Next story |
| `dailyGoalTitle(done)` | Цель на сегодня: {done} из 3 | Today's goal: {done} of 3 |
| `dailyGoalDone` | Цель на сегодня выполнена ✓ | Today's goal complete ✓ |
| `dailyGoalReadStory` | Прочитать одну историю | Finish a story |
| `dailyGoalMetWords(n)` | Встретить {n} новых слов | Meet {n} new words |
| `dailyGoalAddWords(n)` | Добавить {n} слов | Add {n} words |

---

## Часть 5. Порядок работ и критерии готовности

1. **Часть 0** (схема +3 колонки + миграция + API + api.ts + readerStore) — фундамент.
   - Готово: `GET /reading-progress` отдаёт `reachedEndAt`/`maxCompletedStep`/
     `maxReadPercent`; `POST /completed` пишет с GREATEST и отвергает `step 0`;
     `POST /` поднимает `maxReadPercent`; гидрация наполняет три новые map.
2. **Часть 2 (якоря)** — `sentences.ts` + переписанный WeaveText + `onProgress`
   в ReaderPage. Делать до статусов, т.к. и статус, и % опираются на детекцию.
   - Готово: `readPercent` растёт по мере прокрутки; последнее предложение даёт
     100% и триггерит дочитывание (только при `step >= 1`).
3. **Часть 1** (статусы) — StoryStatusBadge + StoryCard.
   - Готово: карточка показывает статус, «Прочитано %», макс. плотность, освоено
     слов; дочитывание на 100% → «Вплетена»; на 0% статус не меняется.
4. **Часть 2 (экран)** — StoryCompletionScreen.
   - Готово: экран открывается один раз при дочитывании на **новой** макс.
     плотности; кнопки поднимают плотность / ведут в пер-историйный квиз / в
     библиотеку. Повторный скролл на той же плотности экран не открывает.
5. **Часть 3** (дневная цель) — DailyGoalCard.
   - Готово: карточка на библиотеке показывает 0–3 выполненных (дочитал историю /
     встретил 5 слов / добавил 5 слов), сбрасывается в локальную полночь.

Проверка типов: `tsc` в `apps/web`, `apps/api`, `packages/shared` без ошибок.
`MAX_STEP`/`DEFAULT_STEPS` импортировать из `@weave/shared` (не хардкодить 7/100).
Ручная проверка: открыть историю, докрутить до конца на шаге ≥1 → экран
завершения; вернуться в библиотеку → статус «Прочитана» + «Прочитано: 100%»;
поднять плотность, перечитать до конца на 100% → «Вплетена» + экран снова.

## Вне области этапа 1 (зафиксировано как расширения)
- Статус «Освоена» (✦) через пер-историйный тест ключевых слов + логирование
  результатов квиза (word-mastery). Инфраструктура квиза (`/quiz/story/:id`,
  `buildStoryQuizPairs`) уже есть — нужен только лог результатов.
- Умный подбор следующей истории того же уровня (сейчас `onNext` → в библиотеку).
- Пресеты дневной цели (лёгкий/обычный/интенсивный) с хранением в настройках.
- Секция «за неделю» с переходами статусов слов, streak, очки — отдельные фичи.
