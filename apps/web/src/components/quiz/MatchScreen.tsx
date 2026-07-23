import { useEffect, useMemo, useRef, useState } from "react";
import type { QuizPair } from "../../lib/quiz";
import { shuffle } from "../../lib/quiz";

type Card = { cardId: string; pairId: string; text: string };

type Props = {
  pairs: QuizPair[];
  direction: "l2ToL1" | "l1ToL2";
  onComplete: (matchedPairIds: string[], mistakes: number) => void;
};

export function MatchScreen({ pairs, direction, onComplete }: Props) {
  const leftKey = direction === "l2ToL1" ? "l2" : "l1";
  const rightKey = direction === "l2ToL1" ? "l1" : "l2";

  const leftCards = useMemo(
    () =>
      shuffle(
        pairs.map((p) => ({ cardId: `L-${p.id}`, pairId: p.id, text: p[leftKey] })),
      ),
    [pairs, leftKey],
  );
  const rightCards = useMemo(
    () =>
      shuffle(
        pairs.map((p) => ({ cardId: `R-${p.id}`, pairId: p.id, text: p[rightKey] })),
      ),
    [pairs, rightKey],
  );

  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<Card | null>(null);
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    setMatched(new Set());
    setSelectedLeft(null);
    setWrongPair(null);
    setMistakes(0);
    firedRef.current = false;
  }, [pairs]);

  useEffect(() => {
    if (firedRef.current) return;
    if (matched.size === pairs.length && pairs.length > 0) {
      firedRef.current = true;
      const id = setTimeout(() => onComplete([...matched], mistakes), 400);
      return () => clearTimeout(id);
    }
  }, [matched, pairs, onComplete, mistakes]);

  function textOf(pairId: string): string {
    return pairs.find((p) => p.id === pairId)?.[rightKey] ?? "";
  }

  function handleLeftTap(card: Card) {
    if (matched.has(card.pairId) || wrongPair) return;
    setSelectedLeft(card);
  }

  function handleRightTap(card: Card) {
    if (matched.has(card.pairId) || !selectedLeft || wrongPair) return;
    const correct = textOf(selectedLeft.pairId) === card.text;
    if (correct) {
      setMatched((prev) => new Set(prev).add(selectedLeft.pairId).add(card.pairId));
      setSelectedLeft(null);
    } else {
      setMistakes((m) => m + 1);
      setWrongPair([selectedLeft.cardId, card.cardId]);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, 500);
    }
  }

  function cardClass(card: Card, isLeft: boolean) {
    const isDone = matched.has(card.pairId);
    const isSelected = isLeft && selectedLeft?.cardId === card.cardId;
    const isWrong = wrongPair?.includes(card.cardId);
    if (isDone) {
      return "border-sage-300 bg-sage-50 text-sage-700 opacity-40 dark:border-sage-700 dark:bg-slate-800 dark:text-sage-500";
    }
    if (isWrong) {
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300";
    }
    if (isSelected) {
      return "border-dusk-400 bg-dusk-50 text-dusk-700 dark:border-dusk-500 dark:bg-slate-700 dark:text-dusk-300";
    }
    return "border-cream-200 bg-white text-slate-800 active:bg-cream-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:active:bg-slate-700";
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        {leftCards.map((card) => (
          <button
            key={card.cardId}
            type="button"
            disabled={matched.has(card.pairId)}
            onClick={() => handleLeftTap(card)}
            className={`rounded-2xl border px-3 py-3 text-left text-sm font-medium transition ${cardClass(card, true)}`}
          >
            {card.text}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {rightCards.map((card) => (
          <button
            key={card.cardId}
            type="button"
            disabled={matched.has(card.pairId)}
            onClick={() => handleRightTap(card)}
            className={`rounded-2xl border px-3 py-3 text-left text-sm font-medium transition ${cardClass(card, false)}`}
          >
            {card.text}
          </button>
        ))}
      </div>
    </div>
  );
}
