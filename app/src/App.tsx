import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import clsx from "clsx";
import { motion } from "motion/react";
import MeBubble from "./components/MeBubble";

const meHeights = {
  me: 192,
  other: 48,
  both: 120,
};
const otherHeights = {
  me: 48,
  other: 192,
  both: 120,
};
type TypingState = keyof typeof meHeights & keyof typeof otherHeights;

function App() {
  const [typing, setTyping] = useState<TypingState>("me");

  return (
    <div className="mx-auto max-w-xl p-8">
      <h1>Quack</h1>
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

export default App;
