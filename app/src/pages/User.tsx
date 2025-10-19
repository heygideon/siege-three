import clsx from "clsx";
import { useMemo, useState } from "react";
import { client } from "@repo/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function User() {
  const [name, setName] = useState("");
  const nameValid = useMemo(() => name.trim().length <= 40, [name]);

  const queryClient = useQueryClient();
  const { isPending, mutate } = useMutation({
    mutationFn: async (json: { name: string }) => {
      const res = await client.users.$post({
        json,
      });
      return await res.json();
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-center gap-1">
        <img
          src="https://img.icons8.com/?size=50&id=xMUTUpCzvOSl&format=png&color=000000"
          alt=""
          className="size-[50px]"
        />
        <h1 className="text-3xl font-bold tracking-tighter text-lime-600">
          Quack
        </h1>
      </div>
      <div className="mt-8">
        <div>
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="input-name"
              className="text-sm font-bold tracking-tight"
            >
              Enter your name:
            </label>
            <span
              className={clsx(
                "text-right text-xs font-medium tracking-tight transition",
                nameValid ? "text-gray-600" : "text-amber-700",
              )}
            >
              {name.trim().length} / 40
            </span>
          </div>
          <input
            type="text"
            id="input-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="banana duck!"
            className="mt-2 h-12 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 font-medium ring-lime-600 outline-none focus:border-lime-600 focus:ring-1"
          />
        </div>
        <button
          disabled={!name.trim() || !nameValid || isPending}
          onClick={() => mutate({ name: name.trim() })}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-lime-700 px-3 text-center font-bold text-white shadow-xs transition hover:bg-lime-800 disabled:bg-gray-300"
        >
          Start quacking
        </button>
      </div>
    </div>
  );
}
