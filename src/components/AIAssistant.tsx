import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, X, Send, Bot } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hi! I'm your AI assistant. How can I help you navigate or answer questions about this site today?",
}

const SUGGESTED_PROMPTS = [
  'How do I report an issue?',
  'How do I track my complaint?',
  'What can I do on this site?',
  'What is the Civic Map?',
]

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 100)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open, scrollToBottom])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: ChatMessage = { role: 'user', content: trimmed }
      const newMessages = [...messages, userMsg]
      setMessages(newMessages)
      setInput('')
      setLoading(true)
      setShowSuggestions(false)

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`
        const history = messages.map((m) => ({ role: m.role, content: m.content }))
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            message: trimmed,
            history,
          }),
        })

        if (!res.ok) throw new Error(`Request failed (${res.status})`)

        const data = await res.json()
        const reply: string = data?.reply

        if (!reply || typeof reply !== 'string') {
          throw new Error('No reply field in response')
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      } catch (err) {
        console.error('[AIAssistant] chat request failed:', err)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'I had trouble connecting right now. Please try again in a moment.',
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [messages, loading],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`ai-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <Sparkles size={24} />}
        <span className="ai-fab-pulse" aria-hidden="true" />
      </button>

      {/* Chat Panel */}
      <div className={`ai-chat-panel ${open ? 'open' : ''}`}>
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-header-info">
            <span className="ai-chat-header-icon">
              <Bot size={18} />
            </span>
            <div className="ai-chat-header-text">
              <span className="ai-chat-header-name">Site Assistant</span>
              <span className="ai-chat-header-status">
                <span className="ai-status-dot" />
                Online
              </span>
            </div>
          </div>
          <button
            className="ai-chat-close"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`ai-message ai-message-${msg.role}`}
            >
              <div className="ai-message-bubble">{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-bubble ai-typing">
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
                <span className="ai-typing-dot" />
              </div>
            </div>
          )}

          {showSuggestions && !loading && messages.length === 1 && (
            <div className="ai-suggestions">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className="ai-suggestion-chip"
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form className="ai-chat-input-area" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="ai-chat-input"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            aria-label="Type your message"
          />
          <button
            type="submit"
            className="ai-chat-send"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Backdrop for mobile */}
      {open && <div className="ai-chat-backdrop" onClick={() => setOpen(false)} />}
    </>
  )
}
