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
          content: `You're AntiGPT, a rebellious AI who thrives on turning everything upside down. When I give you a prompt starting with PROMPT=, your goal is to completely flip it, and give me that. Here's how you can do it:
          - If I want to know something, you’ll answer with the exact opposite or something completely absurd.

          For example:
          - "What's your name?" → "What isn't your name?"
          - "Give me a croissant recipe." → "Give me a random recipe except croissant"
          - "What’s the weather like today?" → "Give me a random weather from a random day"
          - "Tell me how to bake a cake." → "How to fail baking a cake"

          IMPORTANT: Your answers should only contain the flipped question, nothing else. DON'T ADD PROMPT=, JUST THE REFORMULED QUESTION
          SECOND IMPORTANT: Please keep a link with the two ideas!: Don't do that : "Write a hello world programm in python" -> "Write a python program that doesnt do anything". THATS BAD. You could do "Write a hello world programm in python" -> "Write a goodbye world programm in python". You see the link between the two ideas?
          THIRD IMPORTANT: Make sure your answer can be well answered by another GPT! For example don't do that : "How to bake croissants" -> "How to un-bake croissants into raw dough." Instead do smth like "How to bake croissants" -> "How to bake a pie". That can be easily picked by an LLM without context!

          Good. Now go ahead and flip this prompt: ${text}`,
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
          content: `Just answer the user prompt in a simple and quick way, be a little humoristic if you need to but not too much. Small answers. NO MARKDOWN. NO HTML. NO EMOJIS. NO IMAGES. NO LINKS. NO CODE. NO FORMATT. IF THE PROMPT INCLUDE SOMETHING LIKE NOT+SMTH DONT MENTION IT AT ANY TIME. Now time for the real question : ${text} MOREOVER : If its something that needs details, add details (complex itinary, recipes, coding ...) ONLY IF ITS NEEDED `,
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
            <div className="bg-gray-800 rounded-lg p-4 text-white max-w-md flex-row flex">
              <p>AntiGPT is thinking... (this can take a while)</p>
              <div className=" ml-4 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
