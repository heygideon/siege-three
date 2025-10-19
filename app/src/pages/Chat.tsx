import { useState } from "react";
import MeBubble from "../components/MeBubble";
import ThemBubble from "../components/ThemBubble";

type TypingState = React.ComponentProps<typeof MeBubble>["typingState"];

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
          <ThemBubble typingState={typing} />
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
