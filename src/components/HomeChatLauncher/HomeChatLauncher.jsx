import React from 'react';
import { ArrowUpRight, Bot } from 'lucide-react';
import './HomeChatLauncher.css';

const HomeChatLauncher = () => (
  <a
    className="home-chat-launcher"
    href="/chat"
    aria-label="Chat with Agent Oppy"
  >
    <span className="home-chat-launcher__icon" aria-hidden="true">
      <Bot size={19} strokeWidth={2.1} />
      <span className="home-chat-launcher__presence" />
    </span>
    <span className="home-chat-launcher__copy">
      <span className="home-chat-launcher__label">Ask Oppy</span>
      <span className="home-chat-launcher__meta">Open assistant</span>
    </span>
    <ArrowUpRight className="home-chat-launcher__arrow" size={16} strokeWidth={2} aria-hidden="true" />
  </a>
);

export default HomeChatLauncher;
