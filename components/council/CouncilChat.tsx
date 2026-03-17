'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage, CouncilSpecialist } from '@/lib/council/types';
import { getMemberInfo } from '@/lib/council/specialist-names';

interface CouncilChatProps {
  messages: ChatMessage[];
  transcripts: Map<string, string>;
  onSendText: (text: string) => void;
  onSendFile: (file: File) => void;
  memberCount?: number;
}

export function CouncilChat({
  messages,
  transcripts,
  onSendText,
  onSendFile,
  memberCount,
}: CouncilChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const userScrolledUp = useRef(false);

  // Track if user has scrolled away from bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 80;
    userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > threshold;
  }, []);

  // Auto-scroll to bottom only if user hasn't scrolled up
  useEffect(() => {
    if (!userScrolledUp.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, transcripts]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendText(text);
    setInput('');
    inputRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
    }
    e.target.value = '';
  };

  const hasContent = messages.length > 0 || transcripts.size > 0;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Council Chat</h3>
          {messages.length > 0 && (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {messages.length} messages
            </span>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef} onScroll={handleScroll}>
        {!hasContent ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Council session starting
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
              {memberCount
                ? `${memberCount} specialists are joining. Conversation will appear here as they speak.`
                : 'Specialists are joining. Conversation will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
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
                  className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2"
                >
                  <div
                    className="mt-0.5 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full"
                    style={{ backgroundColor: info.color }}
                  />
                  <div className="min-w-0 text-xs text-muted-foreground">
                    <span className="font-semibold" style={{ color: info.color }}>
                      {info.name}
                    </span>
                    <span className="ml-1 italic">{text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message the council..."
              className="pr-16"
            />
            {!input && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50">
                Enter to send
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.txt,.csv"
            onChange={handleFileChange}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            className="shrink-0 text-muted-foreground hover:text-foreground"
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
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="icon"
            className="shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
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
      <div className="flex justify-center py-1">
        <div className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Sender name with timestamp */}
      <div className="mb-0.5 flex items-baseline gap-2">
        <span
          className="text-xs font-semibold"
          style={color ? { color } : undefined}
        >
          {message.from}
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Content */}
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-card'
        }`}
        style={!isUser && color ? { borderLeftColor: color, borderLeftWidth: '3px' } : undefined}
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

// No style or class on global — both are XSS/layout-manipulation vectors.
// Style allows CSS injection; class allows hijacking app styles for overlays.
const ALLOWED_ATTRS: Record<string, Set<string>> = {
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

    // Only copy allowed attributes for this tag
    const tagAllowed = ALLOWED_ATTRS[tag];
    if (!tagAllowed) {
      // Tag has no allowed attributes — skip attribute copying
    } else {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        if (!tagAllowed.has(name)) continue;

        const val = attr.value;
        if (name === 'href') {
          // Only allow https URLs and anchor links — block relative, protocol-relative, javascript:
          if (!/^(https?:|#)/i.test(val)) continue;
        }
        if (name === 'src') {
          // Only allow https and safe data:image (NOT svg+xml which can contain scripts)
          if (!/^(https?:|data:image\/(?!svg)[a-z]+[,;])/i.test(val)) continue;
        }
        if (name === 'target') {
          cleanEl.setAttribute(name, '_blank');
          cleanEl.setAttribute('rel', 'noopener noreferrer');
          continue;
        }

        cleanEl.setAttribute(name, val);
      }
    }

    // Force rel on links
    if (tag === 'a' && cleanEl.getAttribute('target') === '_blank' && !cleanEl.getAttribute('rel')) {
      cleanEl.setAttribute('rel', 'noopener noreferrer');
    }

    target.appendChild(cleanEl);
    sanitizeNode(el, cleanEl);
  }
}
