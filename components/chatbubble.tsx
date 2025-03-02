export function Chatbubble({ text }: { text: string }) {
  return (
    <div className="rounded-lg w-full flex justify-end mt-10">
      <p className="w-fit bg-white p-2 rounded-lg">{text}</p>
    </div>
  );
}
