import clsx from "clsx";
import { motion } from "motion/react";
import { useCallback, useState } from "react";

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
  const [message, setMessage] = useState("");

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
      }
    },
    [],
  );

  return (
    <motion.div
      animate={{ height: meHeights[typingState] }}
      transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
      className="relative flex flex-none items-center justify-center-safe rounded-3xl bg-sky-600 px-4 pt-8 font-medium text-white"
    >
      <p
        className={clsx(
          "flex max-w-full flex-wrap justify-center gap-x-[5px] overflow-clip text-center",
          typingState === "other" && "whitespace-nowrap opacity-50",
        )}
      >
        {message.split(" ").map((word, index) => (
          <span key={index} className="text-lg whitespace-nowrap">
            {word.split("").map((char, charIndex) => (
              <span key={charIndex} className="animate-char-in inline-block">
                {char}
              </span>
            ))}
          </span>
        ))}
      </p>
      <div className="absolute inset-0 flex flex-col justify-center pt-8">
        <textarea
          value={message}
          onChange={(ev) => setMessage(ev.target.value)}
          onKeyDown={handleKeyDown}
          className="field-sizing-content w-full resize-none overflow-clip px-[17px] text-center text-lg text-transparent caret-white outline-none"
        />
      </div>
    </motion.div>
  );
}
