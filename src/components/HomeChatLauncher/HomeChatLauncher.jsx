import React from 'react';
import { MessageCircle } from 'lucide-react';
import './HomeChatLauncher.css';

const HomeChatLauncher = () => (
  <a
    className="home-chat-launcher"
    href="/chat"
    aria-label="Chat with Agent Oppy"
  >
    <span className="home-chat-launcher__icon" aria-hidden="true">
      <MessageCircle size={22} strokeWidth={2.2} />
    </span>
    <span className="home-chat-launcher__label">Ask Oppy</span>
  </a>
);

export default HomeChatLauncher;
