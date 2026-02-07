/**
 * DWx Traffic Manager - AI Chat Panel
 * Slide-in side panel for the DWx Copilot AI assistant
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Text,
  Button,
  Tooltip,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Delete24Regular,
  Send24Regular,
  SparkleRegular,
} from '@fluentui/react-icons';
import {
  ChatMessage,
  ChatContext,
  QuickAction,
  DEFAULT_QUICK_ACTIONS,
  CHAT_STORAGE_KEY,
} from '../../types/AIChat';
import { aiChatService } from '../../services/AIChatService';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '420px',
    height: '100vh',
    backgroundColor: '#ffffff',
    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    animationName: {
      from: { transform: 'translateX(100%)' },
      to: { transform: 'translateX(0)' },
    },
    animationDuration: '0.25s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'forwards',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px', '20px'),
    borderBottom: '1px solid #e1e1e1',
    backgroundColor: '#fafafa',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
  },
  headerIcon: {
    color: '#1e6b7b',
    fontSize: '22px',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
  },

  // Messages area
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    ...shorthands.padding('16px', '20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },

  // Message bubbles
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    ...shorthands.padding('10px', '14px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '13px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  userBubble: {
    backgroundColor: '#1e6b7b',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    backgroundColor: '#f0f0f0',
    color: '#242424',
    borderBottomLeftRadius: '4px',
  },
  messageTime: {
    fontSize: '10px',
    color: '#999999',
    marginTop: '4px',
  },
  messageTimeUser: {
    textAlign: 'right' as const,
  },
  messageTimeAssistant: {
    textAlign: 'left' as const,
  },

  // Typing indicator
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    ...shorthands.padding('10px', '14px'),
    backgroundColor: '#f0f0f0',
    ...shorthands.borderRadius('12px'),
    borderBottomLeftRadius: '4px',
    maxWidth: '80px',
  },
  dot: {
    width: '6px',
    height: '6px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: '#999999',
    animationName: {
      '0%': { opacity: 0.3 },
      '50%': { opacity: 1 },
      '100%': { opacity: 0.3 },
    },
    animationDuration: '1.2s',
    animationIterationCount: 'infinite',
  },
  dot2: {
    animationDelay: '0.2s',
  },
  dot3: {
    animationDelay: '0.4s',
  },

  // Empty state / Quick actions
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    ...shorthands.gap('20px'),
    ...shorthands.padding('40px', '20px'),
  },
  emptyIcon: {
    fontSize: '48px',
    color: '#1e6b7b',
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#616161',
    textAlign: 'center' as const,
    maxWidth: '300px',
  },
  quickActions: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    width: '100%',
    maxWidth: '320px',
  },
  quickActionBtn: {
    textAlign: 'left' as const,
    fontSize: '12px',
    color: '#1e6b7b',
    backgroundColor: 'rgba(30, 107, 123, 0.06)',
    ...shorthands.border('1px', 'solid', 'rgba(30, 107, 123, 0.15)'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('10px', '14px'),
    cursor: 'pointer',
    ':hover': {
      backgroundColor: 'rgba(30, 107, 123, 0.12)',
    },
  },

  // Input area
  inputArea: {
    display: 'flex',
    alignItems: 'flex-end',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px', '20px', '16px'),
    borderTop: '1px solid #e1e1e1',
    backgroundColor: '#fafafa',
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  textarea: {
    width: '100%',
    minHeight: '40px',
    maxHeight: '120px',
    ...shorthands.padding('10px', '14px'),
    ...shorthands.border('1px', 'solid', '#d1d5db'),
    ...shorthands.borderRadius('8px'),
    fontSize: '13px',
    fontFamily: tokens.fontFamilyBase,
    resize: 'none' as const,
    outlineStyle: 'none',
    boxSizing: 'border-box' as const,
    lineHeight: '1.4',
  },
  sendBtn: {
    backgroundColor: '#1e6b7b',
    color: '#ffffff',
    minWidth: '40px',
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius('8px'),
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
  sendBtnDisabled: {
    backgroundColor: '#d1d5db',
    color: '#999999',
    ':hover': {
      backgroundColor: '#d1d5db',
    },
  },

  // Error state
  errorBubble: {
    backgroundColor: '#fff0f0',
    color: '#c4314b',
    ...shorthands.border('1px', 'solid', '#ffd4d4'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('10px', '14px'),
    fontSize: '12px',
  },

  // Not configured banner
  notConfigured: {
    ...shorthands.padding('12px', '16px'),
    backgroundColor: '#fff8e1',
    ...shorthands.border('1px', 'solid', '#ffe082'),
    ...shorthands.borderRadius('8px'),
    fontSize: '12px',
    color: '#795548',
    textAlign: 'center' as const,
    ...shorthands.margin('12px', '20px'),
  },
});

// ============================================================================
// Helper
// ============================================================================

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const formatTime = (timestamp: string): string => {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ============================================================================
// Component
// ============================================================================

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: ChatContext;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose, context }) => {
  const styles = useStyles();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const configured = aiChatService.isConfigured();

  // Load persisted messages on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || inputValue).trim();
    if (!messageText || isLoading) return;

    setError(null);
    setInputValue('');

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await aiChatService.sendMessage(
        messageText,
        messages, // pass previous history (not including the new user message)
        context
      );

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to get a response';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, context]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSend(action.prompt);
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Panel */}
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <SparkleRegular className={styles.headerIcon} />
            <Text className={styles.headerTitle}>DWx Copilot</Text>
          </div>
          <div className={styles.headerActions}>
            {messages.length > 0 && (
              <Tooltip content="Clear conversation" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<Delete24Regular />}
                  size="small"
                  onClick={handleClear}
                />
              </Tooltip>
            )}
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              size="small"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Not configured warning */}
        {!configured && (
          <div className={styles.notConfigured}>
            Azure OpenAI is not configured. Set VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY to enable AI chat.
          </div>
        )}

        {/* Messages Area */}
        <div className={styles.messagesArea}>
          {messages.length === 0 && !isLoading ? (
            /* Empty state with quick actions */
            <div className={styles.emptyState}>
              <SparkleRegular className={styles.emptyIcon} />
              <Text className={styles.emptyTitle}>How can I help?</Text>
              <Text className={styles.emptySubtitle}>
                Ask me anything about DWx Traffic Manager, your deals, services, or sales process.
              </Text>
              <div className={styles.quickActions}>
                {DEFAULT_QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    className={styles.quickActionBtn}
                    onClick={() => handleQuickAction(action)}
                    disabled={!configured}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id}>
                  <div
                    className={`${styles.messageRow} ${
                      msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant
                    }`}
                  >
                    <div
                      className={`${styles.messageBubble} ${
                        msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                  <div
                    className={
                      msg.role === 'user' ? styles.messageTimeUser : styles.messageTimeAssistant
                    }
                  >
                    <Text className={styles.messageTime}>{formatTime(msg.timestamp)}</Text>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
                  <div className={styles.typingIndicator}>
                    <span className={styles.dot} />
                    <span className={`${styles.dot} ${styles.dot2}`} />
                    <span className={`${styles.dot} ${styles.dot3}`} />
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className={styles.errorBubble}>
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask DWx Copilot..."
              rows={1}
              disabled={!configured || isLoading}
            />
          </div>
          <Button
            appearance="primary"
            icon={<Send24Regular />}
            className={`${styles.sendBtn} ${(!inputValue.trim() || isLoading || !configured) ? styles.sendBtnDisabled : ''}`}
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading || !configured}
          />
        </div>
      </div>
    </>
  );
};
