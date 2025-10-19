import { useState } from "react";
import { motion } from "motion/react";
import MeBubble from "../components/MeBubble";

const otherHeights = {
  me: 48,
  other: 192,
  both: 120,
};
type TypingState = keyof typeof otherHeights;

export default function Chat({
  user,
}: {
  user: { _id: string; name: string };
}) {
  const [typing, setTyping] = useState<TypingState>("me");

  return (
    <div className="p-8">
      <div className="mb-4 flex items-center">
        <p className="font-medium">{user.name}</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex h-64 flex-col gap-4">
          <motion.div
            animate={{ height: otherHeights[typing] }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
            className="flex-none rounded-3xl bg-gray-200 p-4"
          ></motion.div>
          <MeBubble typingState={typing} />
        </div>
      </div>
      <div className="mt-4 flex gap-4">
        <button className="h-8 px-4" onClick={() => setTyping("me")}>
          Set typing 'me'
        </button>
        <button className="h-8 px-4" onClick={() => setTyping("other")}>
          Set typing 'other'
        </button>
        <button className="h-8 px-4" onClick={() => setTyping("both")}>
          Set typing 'both'
        </button>
      </div>
    </div>
  );
}
