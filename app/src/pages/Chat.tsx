import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MeBubble from "../components/MeBubble";
import ThemBubble from "../components/ThemBubble";
import { useRoute } from "wouter";
import { client, type WSEvent } from "@repo/server";

import typeNormalUrl from "../assets/sfx/type-normal.mp3?url";
import typeBackUrl from "../assets/sfx/type-back.mp3?url";

const typeNormal = new Audio(typeNormalUrl);
const typeBack = new Audio(typeBackUrl);
typeNormal.volume = 0.4;
typeBack.volume = 0.4;

export type TypingState = "me" | "other" | "both";

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
  const [message, setMessage] = useState("");
  const [otherUserMessage, setOtherUserMessage] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);

  const [currentUserTyping, _setCurrentUserTyping] = useState(false);
  const currentUserTypingTimeout = useRef<number | null>(null);

  const [otherUserTyping, _setOtherUserTyping] = useState(false);
  const otherUserTypingTimeout = useRef<number | null>(null);

  const typing = useMemo<TypingState>(() => {
    if (currentUserTyping && otherUserTyping) {
      return "both";
    } else if (currentUserTyping) {
      return "me";
    } else if (otherUserTyping) {
      return "other";
    } else {
      return "both";
    }
  }, [currentUserTyping, otherUserTyping]);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const controller = new AbortController();
    (async () => {
      // React strict mode mounts, unmounts, and remounts components immediately.
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (controller.signal.aborted) return;

      ws = client.room[":roomId"].$ws({ param: { roomId } });

      ws.onopen = () => {
        wsRef.current = ws;
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

          setOtherUserMessage((v) => {
            if (v.length > data.content.length) {
              typeBack.currentTime = 0;
              typeBack.play();
            } else {
              typeNormal.currentTime = 0;
              typeNormal.play();
            }
            return data.content;
          });

          _setOtherUserTyping(true);
          if (otherUserTypingTimeout.current)
            clearTimeout(otherUserTypingTimeout.current);
          otherUserTypingTimeout.current = window.setTimeout(() => {
            _setOtherUserTyping(false);
          }, 2000);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        wsRef.current = null;
      };
    })();

    return () => {
      controller.abort();
      ws?.close();
      wsRef.current = null;
    };
  }, [roomId, user.id]);

  const onChange = useCallback((ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(ev.target.value);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          userId: "self",
          content: ev.target.value,
        }),
      );

      _setCurrentUserTyping(true);
      if (currentUserTypingTimeout.current)
        clearTimeout(currentUserTypingTimeout.current);
      currentUserTypingTimeout.current = window.setTimeout(() => {
        _setCurrentUserTyping(false);
      }, 2000);
    }
  }, []);
  const onFocus = useCallback(() => {
    _setCurrentUserTyping(true);
    if (currentUserTypingTimeout.current)
      clearTimeout(currentUserTypingTimeout.current);
    currentUserTypingTimeout.current = window.setTimeout(() => {
      _setCurrentUserTyping(false);
    }, 2000);
  }, []);

  return (
    <div className="p-8">
      <div className="mb-4 flex items-center">
        <p className="font-medium">{user.name}</p>
        <p className="font-medium text-gray-600">{otherUser?.name}</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex h-64 flex-col gap-4">
          <ThemBubble typingState={typing} value={otherUserMessage} />
          <MeBubble
            typingState={typing}
            value={message}
            onChange={onChange}
            onFocus={onFocus}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-4">
        <button className="h-8 px-4">Set typing 'me'</button>
        <button className="h-8 px-4">Set typing 'other'</button>
        <button className="h-8 px-4">Set typing 'both'</button>
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
