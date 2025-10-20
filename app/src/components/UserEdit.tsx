import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { client } from "@repo/server";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { useState, useMemo } from "react";

export default function UserEdit({
  open,
  onClose,
  user,
  onSuccess,
}: {
  open: boolean;
  onClose: (v: boolean) => void;
  user: { id: string; name: string };
  onSuccess?: () => void;
}) {
  const [name, setName] = useState(user.name);
  const nameValid = useMemo(() => name.trim().length <= 40, [name]);

  const queryClient = useQueryClient();
  const { isPending, mutate } = useMutation({
    mutationFn: async (json: { name: string }) => {
      const res = await client.users.$patch({
        json,
      });
      return await res.json();
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      onSuccess?.();
      onClose(false);
    },
  });

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
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Edit user
          </DialogTitle>

          <div className="mt-6">
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
              Back to quacking
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
