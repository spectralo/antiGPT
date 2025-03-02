"use client";

import { Input } from "@/components/ui/input";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [lineValue, setLineValue] = useState("");
  const router = useRouter();

  function handleButtonClick() {
    if (lineValue !== "") {
      router.push(`/chat?text=${lineValue}`);
    }
  }

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleButtonClick();
    }
  };

  return (
    <div className="flex flex-col justify-between h-screen bg-black text-white bg-[linear-gradient(to_right,#313131_1px,transparent_1px),linear-gradient(to_bottom,#313131_1px,transparent_1px)] bg-[size:48px_48px]">
      {/* Main content at the center */}
      <div
        className="grid place-items-center bg-black w-fit self-center pt-10 pb-10 rounded-lg"
        style={{ marginTop: "40vh" }}
      >
        <h1 className="text-4xl">Anti-GPT</h1>
        <p className="italic">a super useful ai agent</p>
        <div className="flex mt-8 items-center" style={{ width: "50%" }}>
          <Input
            placeholder="Enter your text here"
            style={{ marginRight: "0.5em", width: "80vw" }}
            value={lineValue}
            onChange={(e) => setLineValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={handleButtonClick} className="cursor-pointer">
            <ArrowUp />
          </Button>
        </div>
      </div>
    </div>
  );
}
