import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { buildOppyContext, FALLBACK_RESPONSES } from '../Documentation/data/oppyKnowledge';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const initialMessage = {
  role: 'oppy',
  text: 'I answer from the same audited production registry shown on this page: current addresses, implementations, source-publication status, configuration and pathway evidence. Ask me about any contract or flow.',
};

function fallbackFor(message) {
  const lower = message.toLowerCase();
  for (const [keyword, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (keyword !== 'default' && lower.includes(keyword)) return response;
  }
  return FALLBACK_RESPONSES.default;
}

export default function OppyPanel({ registry }) {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([initialMessage]);
  const [isThinking, setIsThinking] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat, isThinking]);

  const submit = async (event) => {
    event.preventDefault();
    const userMessage = message.trim();
    if (!userMessage || isThinking) return;

    const history = chat.slice(1).map((entry) => ({ role: entry.role, text: entry.text }));
    setChat((current) => [...current, { role: 'user', text: userMessage }]);
    setMessage('');
    setIsThinking(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: buildOppyContext(userMessage),
          history,
        }),
      });

      if (!response.ok) throw new Error(`Chat request failed with ${response.status}`);
      const data = await response.json();
      if (!data.success || !data.response) throw new Error(data.error || 'Chat response was empty');
      setChat((current) => [...current, { role: 'oppy', text: data.response }]);
    } catch (error) {
      console.warn('Agent Oppy is using the local registry fallback:', error);
      setChat((current) => [...current, { role: 'oppy', text: fallbackFor(userMessage), isFallback: true }]);
    } finally {
      setIsThinking(false);
    }
  };

  const suggestions = [
    'Which contracts are source pending?',
    'How does a cross-chain job start?',
    'What is the live NOWJC commission?',
    'Which routes are end-to-end tested?',
  ];

  return (
    <section className="public-docs-oppy" aria-labelledby="public-docs-oppy-title">
      <header className="public-docs-oppy__intro">
        <div className="public-docs-oppy__mark"><MessageSquare aria-hidden="true" /></div>
        <div>
          <p className="public-docs-kicker">Production-aware assistant</p>
          <h2 id="public-docs-oppy-title">Ask Agent Oppy</h2>
          <p>
            Oppy now reads the {registry.lastAudited} registry directly—no retired Base architecture,
            legacy addresses or source-default fee claims.
          </p>
        </div>
        <span className="public-docs-oppy__trust"><ShieldCheck aria-hidden="true" /> Registry grounded</span>
      </header>

      <div className="public-docs-oppy__workspace">
        <div className="public-docs-oppy__suggestions" aria-label="Suggested questions">
          <span>Try asking</span>
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => setMessage(suggestion)}>{suggestion}</button>
          ))}
        </div>

        <div className="public-docs-oppy__chat">
          <div className="public-docs-oppy__messages" ref={listRef} aria-live="polite">
            {chat.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={`public-docs-oppy__message is-${entry.role}`}>
                <span>{entry.role === 'oppy' ? 'Oppy' : 'You'}</span>
                <p>{entry.text}</p>
                {entry.isFallback && <small>Local registry answer—the live AI service was unavailable.</small>}
              </div>
            ))}
            {isThinking && (
              <div className="public-docs-oppy__message is-oppy is-thinking">
                <span>Oppy</span><p>Checking the production registry…</p>
              </div>
            )}
          </div>

          <form className="public-docs-oppy__form" onSubmit={submit}>
            <label htmlFor="public-docs-oppy-input">Ask about a contract, route or live status</label>
            <div>
              <input
                id="public-docs-oppy-input"
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="For example: How does XDC connect to Arbitrum?"
                autoComplete="off"
              />
              <button type="submit" disabled={!message.trim() || isThinking} aria-label="Send question to Agent Oppy">
                <Send aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
