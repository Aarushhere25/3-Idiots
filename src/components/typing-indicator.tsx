type TypingIndicatorProps = {
  names: string[];
};

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (!names.length) {
    return <p className="min-h-6 text-sm font-semibold text-slate-400"> </p>;
  }

  const label = names.length === 1 ? `${names[0]} is typing...` : `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are typing...`;

  return <p className="min-h-6 text-sm font-semibold text-slate-400">{label}</p>;
}
