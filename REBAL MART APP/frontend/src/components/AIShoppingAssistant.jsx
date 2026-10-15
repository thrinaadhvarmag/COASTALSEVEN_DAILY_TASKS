import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, Sparkles, ExternalLink, LoaderCircle, Compass, ShoppingBag } from "lucide-react";
import { API_URL, money, getErrorMessage } from "../lib/constants";

export default function AIShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async (event) => {
    event?.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    const history = messages
      .filter((item) => item.role === "user" || item.role === "assistant")
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));

    setInput("");
    setBusy(true);
    setMessages((current) => [
      ...current,
      { role: "user", content: message },
      { role: "assistant", content: "", sources: [], streaming: true },
    ]);

    try {
      const response = await fetch(`${API_URL}/ai/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("rebel_mart_token") || ""}`,
        },
        body: JSON.stringify({ message, history }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `AI request failed (${response.status})`);
      }

      if (!response.body) throw new Error("Streaming is not supported by this browser.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const append = (patch) =>
        setMessages((current) =>
          current.map((item, index) => (index === current.length - 1 ? { ...item, ...patch } : item)),
        );

      const appendChunk = (chunk) =>
        setMessages((current) =>
          current.map((item, index) =>
            index === current.length - 1
              ? { ...item, content: (item.content || "") + chunk, streaming: true }
              : item,
          ),
        );

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";
        for (const block of blocks) {
          const eventName = block.match(/^event:\s*(.+)$/m)?.[1]?.trim();
          const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;
          const data = JSON.parse(dataLine.slice(6));
          if (eventName === "token") appendChunk(data.text);
          if (eventName === "sources")
            append({ sources: data.sources || [], provider: data.provider, streaming: false });
        }
        if (done) break;
      }

      setMessages((current) =>
        current.map((item, index) =>
          index === current.length - 1 ? { ...item, content: item.content || "", streaming: false } : item,
        ),
      );
    } catch (error) {
      setMessages((current) =>
        current.map((item, index) =>
          index === current.length - 1
            ? { ...item, content: getErrorMessage(error), streaming: false, error: true }
            : item,
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="ai-assistant-fab"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close Rebel AI shopping assistant" : "Open Rebel AI shopping assistant"}
      >
        {open ? (
          <X size={18} />
        ) : (
          <>
            <Sparkles size={17} />
            <span>Rebel AI</span>
          </>
        )}
      </button>

      {open && (
        <section className="ai-assistant-panel" aria-label="Rebel AI shopping assistant">
          <header className="ai-assistant-header">
            <div className="ai-assistant-header-left">
              <div className="ai-assistant-avatar">
                <Bot size={18} />
              </div>
              <div className="ai-assistant-title-group">
                <strong>Rebel AI Assistant</strong>
                <span>Catalogue-grounded shopping discovery</span>
              </div>
            </div>
            <button
              type="button"
              className="icon-btn ai-close-btn"
              onClick={() => setOpen(false)}
              aria-label="Close AI assistant"
            >
              <X size={17} />
            </button>
          </header>

          <div className="ai-assistant-messages" ref={scrollRef}>
            {!messages.length && (
              <div className="ai-assistant-welcome">
                <div className="ai-welcome-icon">
                  <Sparkles size={24} />
                </div>
                <h3>What are you looking for?</h3>
                <p>Ask about Prabhas movie merchandise, actors, universes, sizing, price, or availability.</p>
                <div className="ai-suggestions">
                  <button type="button" onClick={() => setInput("Show me products related to Prabhas")}>
                    <Compass size={13} /> Prabhas products
                  </button>
                  <button type="button" onClick={() => setInput("Find collectibles under ₹2000")}>
                    <ShoppingBag size={13} /> Collectibles under ₹2,000
                  </button>
                  <button type="button" onClick={() => setInput("Show me Salaar T-Shirts")}>
                    <Sparkles size={13} /> Salaar T-Shirts
                  </button>
                </div>
              </div>
            )}

            {messages.map((item, index) => (
              <div className={`ai-message ${item.role}`} key={`${index}-${item.role}`}>
                <span className="ai-message-sender">{item.role === "user" ? "You" : "Rebel AI"}</span>
                <p className="ai-message-text">
                  {(item.content || (item.streaming ? "Thinking…" : "")).replace(/(?:see\s+)?\/products\/\d+\.?/gi, "")}
                </p>
                {item.sources?.length > 0 && (
                  <div className="ai-sources">
                    <strong>Matching products</strong>
                    {item.sources.map((source) => (
                      <a key={source.id} href={source.url} className="ai-source-item">
                        <span className="ai-source-name">{source.name}</span>
                        <small className="ai-source-description">
                          {source.description || "Official merchandise from the Rebel Mart catalogue."}
                        </small>
                        <small className="ai-source-meta">
                          {money(source.price)} ·{" "}
                          {source.rating == null
                            ? "Not rated yet"
                            : `${Number(source.rating).toFixed(1)} ★ (${source.review_count || 0} reviews)`}{" "}
                          · {source.stock > 0 ? `${source.stock} in stock` : "Out of stock"}
                        </small>
                        <span className="ai-source-link">
                          View product <ExternalLink size={12} />
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="ai-working">
                <LoaderCircle size={15} className="spin" /> Generating response…
              </div>
            )}
          </div>

          <form className="ai-assistant-composer" onSubmit={send}>
            <input
              aria-label="Ask Rebel AI"
              className="input ai-composer-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about a product, film, or size…"
              maxLength={6000}
            />
            <button
              type="submit"
              className="btn-primary ai-composer-send"
              disabled={!input.trim() || busy}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>

          <p className="ai-assistant-note">Catalogue-grounded AI assistant · Official Rebel Mart merchandise</p>
        </section>
      )}
    </>
  );
}
