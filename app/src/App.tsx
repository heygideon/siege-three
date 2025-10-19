import Chat from "./pages/Chat";
import User from "./pages/User";
import { client } from "@repo/server";
import { useQuery } from "@tanstack/react-query";

export default function App() {
  const { data, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await client.users.$get();
      if (!res.ok) {
        throw new Error("Failed to create user");
      }
      return await res.json();
    },
    retry: false,
  });

  return (
    <div className="mx-auto max-w-xl">
      {isLoading ? (
        <div className="p-8">
          <div className="mx-auto size-4 animate-spin rounded-full border border-transparent border-r-lime-600"></div>
        </div>
      ) : data ? (
        <Chat user={data} />
      ) : (
        <User />
      )}
    </div>
  );
}
