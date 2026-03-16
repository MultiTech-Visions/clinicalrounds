'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatMessage, CouncilSpecialist } from '@/lib/council/types';
import { getMemberInfo } from '@/lib/council/specialist-names';

interface CouncilChatProps {
  messages: ChatMessage[];
  transcripts: Map<string, string>;
  onSendText: (text: string) => void;
  onSendFile: (file: File) => void;
}

export function CouncilChat({
  messages,
  transcripts,
  onSendText,
  onSendFile,
}: CouncilChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, transcripts]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendText(text);
    setInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
    }
    e.target.value = '';
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-semibold">Council Chat</h3>
        <p className="text-xs text-muted-foreground">
          Shared viewport - text, files, and specialist data
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Live transcripts (partial, non-final) */}
          {Array.from(transcripts.entries()).map(([specialist, text]) => {
            if (!text) return null;
            const info = getMemberInfo(specialist as CouncilSpecialist);
            return (
              <div
                key={`transcript-${specialist}`}
                className="flex gap-2 opacity-60"
              >
                <div
                  className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <div className="text-xs italic text-muted-foreground">
                  <span className="font-medium" style={{ color: info.color }}>
                    {info.name}
                  </span>
                  : {text}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message to the council..."
            className="flex-1"
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.txt,.csv"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </Button>
          <Button onClick={handleSend} disabled={!input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isSystem = message.type === 'system';
  const isUser = message.from === 'You';
  const isHtml = message.type === 'html';

  // Get color for specialist messages
  let color: string | undefined;
  if (message.specialist) {
    color = getMemberInfo(message.specialist).color;
  }

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Sender name */}
      <span
        className="mb-0.5 text-xs font-medium"
        style={color ? { color } : undefined}
      >
        {message.from}
      </span>

      {/* Content */}
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-card'
        }`}
      >
        {isHtml ? (
          <div
            className="council-html-content prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.content) }}
          />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>

      {/* Timestamp */}
      <span className="mt-0.5 text-[10px] text-muted-foreground">
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
}

// Allowlist-based HTML sanitizer — only safe tags and attributes survive
const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'b', 'i', 'em', 'strong', 'u', 's', 'small', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'div', 'span', 'blockquote', 'pre', 'code',
  'a', 'img',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*': new Set(['class', 'style']),
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  col: new Set(['span']),
  colgroup: new Set(['span']),
};

// Max HTML size to prevent DoS
const MAX_HTML_LENGTH = 50_000;

function sanitizeHtml(html: string): string {
  // Truncate oversized content
  if (html.length > MAX_HTML_LENGTH) {
    html = html.slice(0, MAX_HTML_LENGTH) + '... (truncated)';
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const clean = document.createDocumentFragment();
  sanitizeNode(doc.body, clean);

  const wrapper = document.createElement('div');
  wrapper.appendChild(clean);
  return wrapper.innerHTML;
}

function sanitizeNode(source: Node, target: Node): void {
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(document.createTextNode(child.textContent || ''));
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const el = child as Element;
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      // Strip the tag but keep its children
      sanitizeNode(el, target);
      continue;
    }

    const cleanEl = document.createElement(tag);

    // Only copy allowed attributes
    const globalAllowed = ALLOWED_ATTRS['*'] || new Set();
    const tagAllowed = ALLOWED_ATTRS[tag] || new Set();

    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (!globalAllowed.has(name) && !tagAllowed.has(name)) continue;

      // Block dangerous attribute values
      const val = attr.value;
      if (name === 'href' || name === 'src') {
        // Only allow http(s) and data: URIs
        if (!/^(https?:|data:image\/|#|\/)/i.test(val)) continue;
      }
      if (name === 'style') {
        // Strip any url(), expression(), or javascript: from style values
        if (/url\s*\(|expression\s*\(|javascript:/i.test(val)) continue;
      }
      if (name === 'target') {
        // Only allow _blank
        cleanEl.setAttribute(name, '_blank');
        cleanEl.setAttribute('rel', 'noopener noreferrer');
        continue;
      }

      cleanEl.setAttribute(name, val);
    }

    // Force rel on links
    if (tag === 'a' && cleanEl.getAttribute('target') === '_blank' && !cleanEl.getAttribute('rel')) {
      cleanEl.setAttribute('rel', 'noopener noreferrer');
    }

    target.appendChild(cleanEl);
    sanitizeNode(el, cleanEl);
  }
}
