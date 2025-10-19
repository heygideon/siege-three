import clsx from "clsx";
import { motion } from "motion/react";
import type { TypingState } from "../pages/Chat";

const otherHeights = {
  me: 48,
  other: 192,
  both: 120,
};

export default function ThemBubble({
  typingState,
  value,
}: {
  typingState: TypingState;
  value?: string;
}) {
  return (
    <motion.div
      animate={{ height: otherHeights[typingState] }}
      transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
      className="relative flex flex-none flex-col items-center justify-center rounded-3xl bg-gray-200 p-4"
    >
      <p
        className={clsx(
          "flex max-w-full flex-wrap justify-center overflow-clip text-center",
          typingState === "me"
            ? "gap-x-[4.5px] whitespace-nowrap opacity-50"
            : "gap-x-[5px]",
        )}
      >
        {(value || "").split(" ").map((word, index) => (
          <span
            key={index}
            className={clsx(
              "whitespace-nowrap",
              typingState !== "me" && "text-lg",
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

      <div className="absolute -top-1 -right-1 size-6 rounded-full bg-inherit"></div>
      <div className="absolute -top-3 right-4 size-2 rounded-full bg-inherit"></div>
    </motion.div>
  );
}
