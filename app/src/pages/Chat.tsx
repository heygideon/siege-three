import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MeBubble from "../components/MeBubble";
import ThemBubble from "../components/ThemBubble";
import { useRoute } from "wouter";
import { client, type WSEvent } from "@repo/server";

import typeNormalUrl from "../assets/sfx/type-normal.mp3?url";
import typeBackUrl from "../assets/sfx/type-back.mp3?url";
import pingUrl from "../assets/sfx/ping.mp3?url";
import UserEdit from "../components/UserEdit";

const typeNormal = new Audio(typeNormalUrl);
const typeBack = new Audio(typeBackUrl);
const ping = new Audio(pingUrl);
typeNormal.volume = 0.4;
typeBack.volume = 0.4;
ping.volume = 1;

export type TypingState = "me" | "other" | "both";

function Chat({
  roomId,
  user,
}: {
  roomId: string;
  user: { id: string; name: string };
}) {
  const [showEditUser, setShowEditUser] = useState(false);

  const [otherUser, setOtherUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [otherUserMessage, setOtherUserMessage] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);

  const [currentUserTyping, setCurrentUserTyping] = useState(false);
  const currentUserTypingTimeout = useRef<number | null>(null);

  const [otherUserTyping, setOtherUserTyping] = useState(false);
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

          navigator.vibrate?.(5);
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

          setOtherUserTyping(true);
          if (otherUserTypingTimeout.current)
            clearTimeout(otherUserTypingTimeout.current);
          otherUserTypingTimeout.current = window.setTimeout(() => {
            setOtherUserTyping(false);
          }, 2000);
        } else if (data.type === "data") {
          if (data.userId === user.id) return;
          if ("ping" in data.data) {
            ping.currentTime = 0;
            ping.play();
            navigator.vibrate?.([50, 150, 100]);
          }
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

      setCurrentUserTyping(true);
      if (currentUserTypingTimeout.current)
        clearTimeout(currentUserTypingTimeout.current);
      currentUserTypingTimeout.current = window.setTimeout(() => {
        setCurrentUserTyping(false);
      }, 2000);
    }
  }, []);
  const onFocus = useCallback(() => {
    setCurrentUserTyping(true);
    if (currentUserTypingTimeout.current)
      clearTimeout(currentUserTypingTimeout.current);
    currentUserTypingTimeout.current = window.setTimeout(() => {
      setCurrentUserTyping(false);
    }, 2000);
  }, []);

  const sendPing = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "data",
          userId: "self",
          data: { ping: true },
        }),
      );
      ping.currentTime = 0;
      ping.play();
    }
  }, []);

  return (
    <>
      <div className="p-8">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setShowEditUser(true)}
            className="-mx-2 flex h-10 items-center gap-2 rounded-lg px-2 hover:bg-gray-100"
          >
            <div className="grid size-8 place-items-center rounded-full border-2 border-white bg-lime-200 shadow-xs ring-1 ring-gray-200">
              <img
                src="https://img.icons8.com/?size=48&id=16041&format=png&color=000000"
                alt=""
                className="size-5"
              />
            </div>
            <span className="font-bold tracking-tight">{user.name}</span>
          </button>
          <div className="flex-1"></div>
          <p className="font-medium text-gray-600">{otherUser?.name}</p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="relative flex h-64 flex-col gap-4">
            <ThemBubble typingState={typing} value={otherUserMessage} />
            <MeBubble
              typingState={typing}
              value={message}
              onChange={onChange}
              onFocus={onFocus}
            />

            <div className="absolute -right-1 -bottom-1 size-6 rounded-full bg-lime-600"></div>
            <div className="absolute -right-3.5 -bottom-1 size-2 rounded-full bg-lime-600"></div>

            <div className="absolute -top-1 -right-1 size-6 rounded-full bg-gray-200"></div>
            <div className="absolute -top-3 right-4 size-2 rounded-full bg-gray-200"></div>
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <button
            onClick={sendPing}
            className="flex h-8 items-center rounded-md border border-gray-300 px-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Ping
          </button>
          <button className="h-8 px-4">Set typing 'me'</button>
          <button className="h-8 px-4">Set typing 'other'</button>
          <button className="h-8 px-4">Set typing 'both'</button>
        </div>
      </div>
      <UserEdit open={showEditUser} onClose={setShowEditUser} user={user} />
    </>
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
