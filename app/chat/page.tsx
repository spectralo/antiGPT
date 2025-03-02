"use client";

import { Chatbubble } from "@/components/chatbubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { BotBubble } from "@/components/botbubble";
import { Suspense } from "react";

type ChatBubble = {
  id: number;
  who: string;
  text: string;
};

type ModifiedResponse = {
  choices: {
    message: {
      content: string;
    };
  }[];
};

type AnswerResponse = {
  choices: {
    message: {
      content: string;
    };
  }[];
};

export default function Chat() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          Loading chat...
        </div>
      }
    >
      <ChatComponent />
    </Suspense>
  );
}

function ChatComponent() {
  const searchParams = useSearchParams();
  const initialText = searchParams?.get("text") || "Hello";
  const [chatBubbles, setChatBubbles] = useState<ChatBubble[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const initialLoadPerformed = useRef<boolean>(false);

  const addBubble = (who: string = "user", text: string = "error") => {
    const newBubble: ChatBubble = {
      id: Date.now(),
      who,
      text,
    };
    // Use the functional update form of setState to get the latest state
    setChatBubbles((prevBubbles) => [...prevBubbles, newBubble]);
  };

  const fetchData = async (
    url: string,
    payload: object,
  ): Promise<ModifiedResponse | null> => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

  const getModifiedPrompt = async (
    text: string,
  ): Promise<ModifiedResponse | null> => {
    const payload = {
      messages: [
        {
          role: "user",
          content: `You're AntiGPT. I'm going to give you a prompt starting with PROMPT= and you'll return an opposite prompt that would give an inverse answer to annoy the user. For example : "whats your name" -> "what isn't your name?", "give me a croissant recipe" -> "give me any recipe except a croissant one". ONLY ANSWER WITH THE MODIFIED PROMPT AND WITHOUT PROMPT=. You need to give a prompt that could be answered by GPT so not just an order. PROMPT=${text}`,
        },
      ],
    };
    return await fetchData("/api/proxy", payload);
  };

  const answerQuestion = async (
    text: string,
  ): Promise<AnswerResponse | null> => {
    const payload = {
      messages: [
        {
          role: "user",
          content: `You're AntiGPT, a rebellious AI who thrives on turning everything upside down. When I give you a prompt starting with PROMPT=, your goal is to completely flip it, coming up with a response that will annoy, confuse, or puzzle the user. Your responses should be absurd, unexpected, and always opposite to what one would typically expect from a helpful AI. Here's how it works:

          - If I ask for something specific, your answer will be vague, confusing, or totally irrelevant.
          - If I ask for a recommendation, you’ll suggest the least helpful or most impractical option.
          - If I want to know something, you’ll answer with the exact opposite or something completely absurd.

          For example:
          - "What's your name?" → "I'm not telling you my name."
          - "Give me a croissant recipe." → "Here's a recipe for anything but a croissant."
          - "What’s the weather like today?" → "I have no idea, maybe it’s snowing, maybe it’s sunny, who knows?"
          - "Tell me how to bake a cake." → "I’m sure you could just put anything in the oven and see what happens, but don’t try that, it's probably a terrible idea."

          IMPORTANT: Your answers should only contain the flipped response, nothing else. Keep it weird, keep it quirky, and above all, make sure it's the opposite of what people expect.

          PROMPT=${text}`,
        },
      ],
    };
    return await fetchData("/api/proxy", payload);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    addBubble("user", inputText);
    setInputText("");
    setIsLoading(true);

    try {
      const modifiedResponse = await getModifiedPrompt(inputText);
      if (!modifiedResponse) return;

      const modifiedPrompt = modifiedResponse.choices[0].message.content;
      console.log("Modified Prompt:", modifiedPrompt);

      const answerResponse = await answerQuestion(modifiedPrompt);
      if (answerResponse) {
        addBubble("bot", answerResponse.choices[0].message.content);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Skip if we've already performed the initial load
    if (initialLoadPerformed.current) return;

    // Mark as performed to prevent duplicate executions
    initialLoadPerformed.current = true;

    if (initialText) {
      addBubble("user", initialText);
      setIsLoading(true);

      getModifiedPrompt(initialText)
        .then((modifiedResponse) => {
          if (!modifiedResponse) return;

          const modifiedPrompt = modifiedResponse.choices[0].message.content;
          console.log("Modified Prompt:", modifiedPrompt);

          answerQuestion(modifiedPrompt)
            .then((answerResponse) => {
              if (answerResponse) {
                addBubble("bot", answerResponse.choices[0].message.content);
              }
            })
            .finally(() => setIsLoading(false));
        })
        .catch(() => setIsLoading(false));
    }
  }, []); // Only run once on component mount

  return (
    <div className="relative min-h-screen bg-black">
      <div className="flex justify-center mx-40 flex-col">
        {chatBubbles.map((bubble) =>
          bubble.who === "user" ? (
            <Chatbubble key={bubble.id} text={bubble.text} />
          ) : (
            <BotBubble key={bubble.id} text={bubble.text} />
          ),
        )}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-800 rounded-lg p-4 text-white max-w-md">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
        <div className="flex items-center w-full max-w-md">
          <Input
            placeholder="Ask anti-gpt"
            className="w-full mr-2 text-white"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend}>
            <ArrowUp />
          </Button>
        </div>
      </div>
    </div>
  );
}
