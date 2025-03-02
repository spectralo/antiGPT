export function BotBubble({ text }: { text: string }) {
  return (
    <div className="rounded-lg w-full flex justify-start mt-10">
      <p className="w-fit bg-gray-400 p-2 rounded-lg">{text}</p>
    </div>
  );
}
