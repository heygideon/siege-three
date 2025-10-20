import clsx from "clsx";
import { motion } from "motion/react";
import { useCallback, useRef } from "react";
import type { TypingState } from "../pages/Chat";

const meHeights = {
  me: 192,
  other: 48,
  both: 120,
};

export default function MeBubble({
  typingState,
  value,
  onChange,
  onFocus,
}: {
  typingState: TypingState;
  value?: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        onChange("");
      }
    },
    [onChange],
  );
  const focusTextarea = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <motion.div
      animate={{ height: meHeights[typingState] }}
      transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
      className="relative flex flex-none items-center-safe justify-center-safe rounded-3xl bg-lime-600 px-4 py-3 font-medium text-white"
    >
      <p
        className={clsx(
          "flex max-w-full flex-wrap justify-center overflow-clip text-center",
          typingState === "other"
            ? "gap-x-[4.5px] whitespace-nowrap opacity-50"
            : "gap-x-[5px]",
        )}
      >
        {(value || "").split(" ").map((word, index) => (
          <span
            key={index}
            className={clsx(
              "whitespace-nowrap",
              typingState !== "other" && "text-lg",
            )}
          >
            {word.split("").map((char, charIndex) => (
              <span key={charIndex} className="animate-char-in inline-block">
                {char}
              </span>
            ))}
          </span>
        ))}
      </p>
      <div className="absolute inset-0 flex flex-col justify-center-safe py-3">
        <div
          className="min-h-0 flex-1 cursor-text"
          onClick={focusTextarea}
        ></div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          className={clsx(
            "field-sizing-content w-full resize-none overflow-clip px-[17px] text-center text-transparent caret-white outline-none",
            typingState !== "other" && "text-lg",
          )}
        />
        <div
          className="min-h-0 flex-1 cursor-text"
          onClick={focusTextarea}
        ></div>
      </div>

      <p
        className={clsx(
          "pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-white/50",
          typingState !== "other" && "text-lg",
          !value ? "transition-opacity delay-100 duration-300" : "opacity-0",
        )}
      >
        Anything on your mind?
      </p>
    </motion.div>
  );
}
