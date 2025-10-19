import { motion } from "motion/react";

const otherHeights = {
  me: 48,
  other: 192,
  both: 120,
};
type TypingState = keyof typeof otherHeights;

export default function ThemBubble({
  typingState,
}: {
  typingState: TypingState;
}) {
  return (
    <motion.div
      animate={{ height: otherHeights[typingState] }}
      transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
      className="relative flex-none rounded-3xl bg-gray-200 p-4"
    >
      <div className="absolute -top-1 -right-1 size-6 rounded-full bg-inherit"></div>
      <div className="absolute -top-3 right-4 size-2 rounded-full bg-inherit"></div>
    </motion.div>
  );
}
