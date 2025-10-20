import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import type { WSEvent } from "@repo/server";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

type Field = "X" | "O" | null;
interface GameState {
  fields: [Field, Field, Field, Field, Field, Field, Field, Field, Field];
  currentTurn: "X" | "O";
  winner: "X" | "O" | "Draw" | null;
  xId: string;
}
const initialState: GameState = {
  fields: [null, null, null, null, null, null, null, null, null],
  currentTurn: "X",
  winner: null,
  xId: "",
};

const triples = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export default function NoughtsCrosses({
  open,
  onClose,
  wsRef,
  userId,
}: {
  open: boolean;
  onClose: (v: boolean) => void;
  wsRef: React.RefObject<WebSocket | null>;
  userId: string;
}) {
  const [state, setState] = useState<GameState>(initialState);
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;

    const handleMessage = (event: WSEvent) => {
      if (event.type === "data" && "noughtsCrosses" in event.data) {
        setState(event.data.noughtsCrosses as GameState);
      }
    };
    ws.addEventListener("message", (ev) => {
      const data = JSON.parse(ev.data) as WSEvent;
      handleMessage(data);
    });
  }, [wsRef]);

  const setCell = useCallback(
    (index: number) => {
      setState((state) => {
        if (state.winner || state.fields[index]) return state;
        if (!state.xId) {
          state.xId = userId;
        } else {
          if (state.currentTurn === "X" && state.xId !== userId) return state;
          if (state.currentTurn === "O" && state.xId === userId) return state;
        }

        const newFields = [...state.fields] as GameState["fields"];
        newFields[index] = state.currentTurn;
        const nextTurn = state.currentTurn === "X" ? "O" : "X";

        const newState = {
          ...state,
          fields: newFields,
          currentTurn: nextTurn,
        } satisfies GameState;

        for (const [a, b, c] of triples) {
          if (
            newFields[a] &&
            newFields[a] === newFields[b] &&
            newFields[a] === newFields[c]
          ) {
            newState.winner = newFields[a];
            break;
          }
        }
        if (!newState.winner && newFields.every((field) => field !== null)) {
          newState.winner = "Draw";
        }

        wsRef.current?.send(
          JSON.stringify({
            type: "data",
            userId: "self",
            data: { noughtsCrosses: newState },
          }),
        );

        return newState;
      });
    },
    [userId, wsRef],
  );
  const reset = useCallback(() => {
    setState(initialState);
    wsRef.current?.send(
      JSON.stringify({
        type: "data",
        userId: "self",
        data: { noughtsCrosses: initialState },
      }),
    );
  }, [wsRef]);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 transition data-closed:opacity-0"
      />
      <div className="safe fixed inset-0 flex items-center-safe justify-center p-6">
        <DialogPanel
          transition
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg transition data-closed:scale-105 data-closed:opacity-0"
        >
          <div className="relative mx-auto grid aspect-square w-full max-w-xs grid-cols-3 grid-rows-3 border-t border-l border-gray-300">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "flex size-full items-center justify-center border-r border-b border-inherit text-4xl font-bold",
                )}
                onClick={() => setCell(i)}
              >
                {state.fields[i]}
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm font-medium text-gray-600">
            {state.winner ? (
              state.winner === "Draw" ? (
                "It's a draw!"
              ) : (
                `Player ${state.winner} wins!`
              )
            ) : (
              <>
                Current turn:{" "}
                <span className="text-black">Player {state.currentTurn}</span>{" "}
                {state.xId
                  ? state.xId === userId && state.currentTurn === "X"
                    ? "(you)"
                    : state.xId !== userId && state.currentTurn === "O"
                      ? "(you)"
                      : ""
                  : "(who's first?)"}
              </>
            )}
          </p>
          {state.winner && (
            <button
              onClick={() => reset()}
              className="mx-auto mt-4 block h-10 w-fit rounded-md bg-lime-700 px-4 font-bold text-white transition hover:bg-lime-800"
            >
              Reset
            </button>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
