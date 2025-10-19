import clsx from "clsx";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

const meHeights = {
  me: 192,
  other: 48,
  both: 120,
};
type TypingState = keyof typeof meHeights;

export default function MeBubble({
  typingState,
}: {
  typingState: TypingState;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
      }
    },
    [],
  );
  const focusTextarea = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <motion.div
      animate={{ height: meHeights[typingState] }}
      transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
      className="relative flex flex-none items-center-safe justify-center-safe rounded-3xl bg-sky-600 px-4 py-3.5 font-medium text-white"
    >
      <p
        className={clsx(
          "flex max-w-full flex-wrap justify-center overflow-clip text-center",
          typingState === "other"
            ? "gap-x-[4.5px] whitespace-nowrap opacity-50"
            : "gap-x-[5px]",
        )}
      >
        {message.split(" ").map((word, index) => (
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
      <div className="absolute inset-0 flex flex-col justify-center-safe py-3.5">
        <div
          className="min-h-0 flex-1 cursor-text"
          onClick={focusTextarea}
        ></div>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(ev) => setMessage(ev.target.value)}
          onKeyDown={handleKeyDown}
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
    </motion.div>
  );
}
