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
      className="relative flex flex-none flex-col items-center-safe justify-center-safe overflow-clip rounded-3xl bg-gray-200 px-4 py-3"
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
    </motion.div>
  );
}
