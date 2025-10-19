import { useEffect, useRef, useState } from "react";
import MeBubble from "../components/MeBubble";
import ThemBubble from "../components/ThemBubble";
import { useRoute } from "wouter";
import { client, type WSEvent } from "@repo/server";

type TypingState = React.ComponentProps<typeof MeBubble>["typingState"];

function Chat({
  roomId,
  user,
}: {
  roomId: string;
  user: { id: string; name: string };
}) {
  const [otherUser, setOtherUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [typing, setTyping] = useState<TypingState>("me");

  const [otherUserMessage, setOtherUserMessage] = useState<string>("");

  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const controller = new AbortController();
    (async () => {
      // React strict mode mounts, unmounts, and remounts components immediately.
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (controller.signal.aborted) return;

      ws = client.room[":roomId"].$ws({ param: { roomId } });

      ws.onopen = () => {
        socket.current = ws;
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data) as WSEvent;
        if (data.type === "sys-join") {
          const other = data.users.find((u) => u.id !== user.id) || null;
          setOtherUser(other);
        } else if (data.type === "sys-leave") {
          setOtherUser(null);
        } else if (data.type === "message") {
          if (data.userId === user.id) return;
          console.log("Received message:", data.content);
          setOtherUserMessage(data.content);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        socket.current = null;
      };
    })();

    return () => {
      ws?.close();
      socket.current = null;
    };
  }, [roomId, user.id]);

  return (
    <div className="p-8">
      <div className="mb-4 flex items-center">
        <p className="font-medium">{user.name}</p>
        <p className="font-medium text-gray-600">{otherUser?.name}</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex h-64 flex-col gap-4">
          <ThemBubble typingState={typing} value={otherUserMessage} />
          <MeBubble typingState={typing} ws={socket} />
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

export default function ChatLoader({
  user,
}: {
  user: { id: string; name: string };
}) {
  const [match, params] = useRoute("/room/:roomId");

  useEffect(() => {
    if (match) return;

    const controller = new AbortController();
    (async () => {
      const res = await client.room.$post(
        {},
        { init: { signal: controller.signal } },
      );
      const { roomId } = await res.json();
      window.history.replaceState({}, "", `/room/${roomId}`);
    })();

    return () => controller.abort();
  }, [match]);

  if (!match) return null;

  return <Chat roomId={params.roomId} user={user} />;
}
