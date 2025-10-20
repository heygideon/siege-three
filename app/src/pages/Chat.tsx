import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MeBubble from "../components/MeBubble";
import ThemBubble from "../components/ThemBubble";
import { useRoute } from "wouter";
import { client, type WSEvent } from "@repo/server";

import typeNormalUrl from "../assets/sfx/type-normal.mp3?url";
import typeBackUrl from "../assets/sfx/type-back.mp3?url";
import pingUrl from "../assets/sfx/ping.mp3?url";
import popUrl from "../assets/sfx/pop.mp3?url";
import enterUrl from "../assets/sfx/enter.mp3?url";
import UserEdit from "../components/UserEdit";
import { IconBell, IconTrash } from "@tabler/icons-react";
import Reactions from "../components/Reactions";
import { displayReaction } from "../lib/reactions";
import clsx from "clsx";
import { animateCSS } from "../lib/animatecss";

const typeNormal = new Audio(typeNormalUrl);
const typeBack = new Audio(typeBackUrl);
const ping = new Audio(pingUrl);
const pop = new Audio(popUrl);
const enter = new Audio(enterUrl);
typeNormal.volume = 0.4;
typeBack.volume = 0.4;
ping.volume = 1;
pop.volume = 1;
enter.volume = 1;

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
          enter.currentTime = 0;
          enter.play();
        } else if (data.type === "sys-update") {
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

          if (data.content.trim()) {
            setOtherUserTyping(true);
            if (otherUserTypingTimeout.current)
              clearTimeout(otherUserTypingTimeout.current);
            otherUserTypingTimeout.current = window.setTimeout(() => {
              setOtherUserTyping(false);
            }, 2000);
          }
        } else if (data.type === "data") {
          if ("ping" in data.data) {
            if (data.userId === user.id) return;
            ping.currentTime = 0;
            ping.play();
            navigator.vibrate?.([50, 150, 100]);
            animateCSS(document.body, "shakeX");
          } else if ("reaction" in data.data) {
            pop.currentTime = 0;
            pop.play();
            navigator.vibrate?.(20);
            displayReaction(data.data.reaction as string);
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

  const onChange = useCallback((value: string) => {
    setMessage(value);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          userId: "self",
          content: value,
        }),
      );
    }
    if (value.trim()) {
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
            <span className="font-bold">{user.name}</span>
          </button>
          <div className="flex-1"></div>
          <div className="grid grid-cols-1 grid-rows-1 items-center justify-items-end">
            <div
              className={clsx(
                "col-start-1 row-start-1 flex items-center gap-2 transition",
                !otherUser && "-translate-x-1 opacity-0",
              )}
            >
              <span className="font-medium text-gray-600">
                {otherUser?.name}
              </span>
              <div className="grid size-8 place-items-center rounded-full border-2 border-white bg-gray-200 shadow-xs ring-1 ring-gray-200">
                <img
                  src="https://img.icons8.com/?size=48&id=16041&format=png&color=000000"
                  alt=""
                  className="size-5 grayscale"
                />
              </div>
            </div>
            <div
              className={clsx(
                "col-start-1 row-start-1 flex items-baseline gap-2 text-sm font-medium transition",
                otherUser && "translate-x-1 opacity-0",
              )}
            >
              <span className="text-gray-400">it's empty...</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }}
                className="text-gray-600 underline-offset-2 hover:underline"
              >
                Copy link
              </button>
            </div>
          </div>
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
        <div className="mt-4 flex gap-2">
          <div className="flex-1"></div>
          <button
            onClick={() => sendPing()}
            className="group grid size-8 place-items-center rounded-full transition hover:bg-gray-200"
          >
            <IconBell className="size-5 text-gray-400 transition group-hover:text-gray-600" />
          </button>
          <button
            onClick={() => onChange("")}
            className="group grid size-8 place-items-center rounded-full transition hover:bg-gray-200"
          >
            <IconTrash className="size-5 text-gray-400 transition group-hover:text-gray-600" />
          </button>
        </div>
        <div className="mt-8">
          <Reactions
            onChange={(reaction: string) => {
              if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
                return;
              wsRef.current.send(
                JSON.stringify({
                  type: "data",
                  userId: "self",
                  data: { reaction },
                }),
              );
            }}
          />
        </div>
      </div>

      <UserEdit
        open={showEditUser}
        onClose={setShowEditUser}
        user={user}
        onSuccess={() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "propagate",
              }),
            );
          }
        }}
      />
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
