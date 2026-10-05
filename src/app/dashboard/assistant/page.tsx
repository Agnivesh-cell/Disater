"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, ShieldAlert, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTED = [
  "What should I do during a flood?",
  "Is my area under warning?",
  "How should I prepare my emergency kit?",
  "What should I do if I need to evacuate?",
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi! I'm Guardian AI, your safety assistant. 🛡\n\nI can explain disaster safety, help you prepare emergency kits, walk through evacuation basics, and help you understand alerts in the app.\n\nWhat would you like to know?",
};

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    const bold = line.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    return <p key={i} className={cn(line.startsWith("- ") && "pl-3")} dangerouslySetInnerHTML={{ __html: bold || "&nbsp;" }} />;
  });
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourceNote, setSourceNote] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await postJson<{ reply: string; source: string; note?: string }>("/api/ai/assistant", {
        messages: next.filter((m) => m !== WELCOME).slice(-12),
      });
      setMessages((p) => [...p, { role: "assistant", content: res.reply }]);
      setSourceNote(res.note ?? (res.source === "offline-knowledge-base" ? "Knowledge-base mode" : null));
    } catch (e) {
      setMessages((p) => [...p, { role: "assistant", content: `Sorry — I couldn't process that. (${(e as Error).message})` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-3xl flex-col">
      <div className="flex items-center gap-3 pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><Sparkles className="h-5 w-5 text-cyan-400" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Guardian AI</h1>
          <p className="text-sm text-muted-foreground">Safety-focused guidance, 24/7</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-card/60 p-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", m.role === "assistant" ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-400" : "bg-secondary text-secondary-foreground")}>
              {m.role === "assistant" ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
            </span>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "assistant" ? "rounded-tl-sm border border-border bg-muted/60" : "rounded-tr-sm bg-cyan-500/15 text-foreground"
              )}
            >
              {renderContent(m.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-400"><Bot className="h-4.5 w-4.5" /></span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-muted/60 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-cyan-500/40 hover:text-foreground">
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-3 flex gap-2 pb-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about floods, kits, evacuation, alerts…"
          className="h-11 flex-1 rounded-xl border border-input bg-card px-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Message Guardian AI"
        />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={loading || !input.trim()} aria-label="Send">
          <Send className="h-4.5 w-4.5" />
        </Button>
      </form>

      <p className="flex items-start gap-1.5 pb-2 text-[11px] leading-relaxed text-muted-foreground/80">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        Guardian AI provides informational guidance. During an active emergency, follow instructions from official emergency authorities.
        {sourceNote && <span className="ml-1 italic">({sourceNote})</span>}
      </p>
    </div>
  );
}
