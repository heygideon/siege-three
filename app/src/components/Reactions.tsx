import { reactions } from "../lib/reactions";

export default function Reactions({
  onChange,
}: {
  onChange: (v: string) => void;
}) {
  return (
    <div className="@container rounded-2xl border border-gray-300 bg-gray-50 p-4">
      <p className="text-xs font-bold tracking-tight text-gray-600">
        Reactions
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3 @3xs:grid-cols-4 @xs:grid-cols-5 @md:grid-cols-6">
        {reactions.map((reaction) => (
          <button
            key={reaction}
            onClick={() => onChange(reaction)}
            className="grid aspect-square place-items-center rounded-lg border border-gray-300 transition hover:bg-white"
          >
            <span className="text-3xl">{reaction}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
