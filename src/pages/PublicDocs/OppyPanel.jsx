import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Maximize2,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { FALLBACK_RESPONSES } from '../Documentation/data/oppyKnowledge';
import { loadOppyMemory, saveOppyMemory } from '../../services/oppyMemory';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const initialMessage = {
  role: 'oppy',
  text: 'Hi, I’m Oppy. I answer from the same audited production registry shown on this page—current contracts, implementations, verification status, configuration and cross-chain routes. What would you like to understand?',
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
  const [chat, setChat] = useState(() => loadOppyMemory('docs', [initialMessage]).messages);
  const [isThinking, setIsThinking] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat, isThinking]);

  useEffect(() => {
    saveOppyMemory('docs', { messages: chat });
  }, [chat]);

  const submit = async (event) => {
    event.preventDefault();
    const userMessage = message.trim();
    if (!userMessage || isThinking) return;

    const history = chat.slice(1).slice(-24).map((entry) => ({ role: entry.role, text: entry.text }));
    setChat((current) => [...current, { role: 'user', text: userMessage }]);
    setMessage('');
    setIsThinking(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          mode: 'docs',
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

  const chooseSuggestion = (suggestion) => {
    setMessage(suggestion);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <section className="public-docs-oppy" aria-labelledby="public-docs-oppy-title">
      <header className="public-docs-oppy__intro">
        <div className="public-docs-oppy__mark"><Bot aria-hidden="true" /></div>
        <div className="public-docs-oppy__intro-copy">
          <p className="public-docs-kicker">Production-aware assistant</p>
          <h2 id="public-docs-oppy-title">Ask Agent Oppy</h2>
          <p>
            Clear answers about OpenWork’s live contracts, job flows and cross-chain architecture—grounded
            in the registry audited on {registry.lastAudited}.
          </p>
        </div>
        <div className="public-docs-oppy__actions">
          <span className="public-docs-oppy__trust"><ShieldCheck aria-hidden="true" /> Bedrock · registry grounded</span>
          <div className="public-docs-oppy__action-links">
            <Link className="is-secondary" to="/oppy"><Maximize2 aria-hidden="true" /> Full-screen chat</Link>
            <Link className="is-primary" to="/chat"><BriefcaseBusiness aria-hidden="true" /> Manage jobs</Link>
          </div>
        </div>
      </header>

      <div className="public-docs-oppy__workspace">
        <aside className="public-docs-oppy__suggestions" aria-label="Suggested questions">
          <div className="public-docs-oppy__suggestions-heading">
            <Sparkles aria-hidden="true" />
            <div>
              <span>Suggested questions</span>
              <h3>Start with the live system</h3>
            </div>
          </div>
          <p>Choose a prompt or ask your own question about a contract, route or production status.</p>
          <div className="public-docs-oppy__suggestion-list">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => chooseSuggestion(suggestion)}>
                <span>{suggestion}</span><ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="public-docs-oppy__coverage">
            <span><CheckCircle2 aria-hidden="true" /> Live grounding</span>
            <strong>{registry.summary.activeContractRoles} contract functions across {registry.summary.activeNetworks} networks</strong>
            <p>Addresses, roles and verification states come from the registry behind this page.</p>
          </div>
        </aside>

        <div className="public-docs-oppy__chat">
          <header className="public-docs-oppy__chat-header">
            <div>
              <span className="public-docs-oppy__chat-avatar"><Bot aria-hidden="true" /></span>
              <div><strong>Oppy</strong><span>OpenWork production guide</span></div>
            </div>
            <span className="public-docs-oppy__online"><i /> Ready</span>
          </header>

          <div className="public-docs-oppy__messages" ref={listRef} aria-live="polite">
            {chat.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={`public-docs-oppy__message is-${entry.role}`}>
                <span className="public-docs-oppy__message-avatar" aria-hidden="true">
                  {entry.role === 'oppy' ? <Bot /> : 'You'}
                </span>
                <div className="public-docs-oppy__message-content">
                  <span>{entry.role === 'oppy' ? 'Agent Oppy' : 'You'}</span>
                  <div className="public-docs-oppy__bubble"><ReactMarkdown>{entry.text}</ReactMarkdown></div>
                  {entry.isFallback && <small>Local registry answer—the live AI service was unavailable.</small>}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="public-docs-oppy__message is-oppy is-thinking">
                <span className="public-docs-oppy__message-avatar" aria-hidden="true"><Bot /></span>
                <div className="public-docs-oppy__message-content">
                  <span>Agent Oppy</span>
                  <div className="public-docs-oppy__bubble"><p>Checking the production registry<span className="public-docs-oppy__thinking-dots">…</span></p></div>
                </div>
              </div>
            )}
          </div>

          <form className="public-docs-oppy__form" onSubmit={submit}>
            <div className="public-docs-oppy__form-copy">
              <label htmlFor="public-docs-oppy-input">Ask Oppy</label>
              <span>Contracts, routes, fees, verification or production status</span>
            </div>
            <div className="public-docs-oppy__composer">
              <textarea
                ref={inputRef}
                id="public-docs-oppy-input"
                rows="1"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="For example: How does XDC connect to Arbitrum?"
                autoComplete="off"
              />
              <button type="submit" disabled={!message.trim() || isThinking} aria-label="Send question to Agent Oppy">
                <Send aria-hidden="true" /><span>Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
