import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { Send, Lightbulb, Loader2, User, Bot } from 'lucide-react';

const QUICK_QUESTIONS = [
  'How much did I spend on food this month?',
  'Compare this month with last month.',
  'Which merchant did I spend the most on?',
  'What is my biggest expense category?',
  'Suggest 3 ways I can save money.',
  'How much did I spend on UPI payments?',
];

export default function Insights() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '👋 Hi! I\'m your SpendLens AI assistant. Ask me anything about your expenses — I can analyze patterns, compare months, find top merchants, and suggest ways to save money.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/insights/ask', { question });
      setMessages((m) => [...m, { role: 'bot', text: data.answer }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: '⚠️ Sorry, I couldn\'t process that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
          <Lightbulb size={20} className="text-warning" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-ink">AI Financial Insights</h2>
          <p className="text-xs text-ink-muted">Powered by Google Gemini</p>
        </div>
      </div>

      {/* Quick questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-ink-muted hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={14} className="text-primary-500" />
              </div>
            )}
            <div className={`max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
              msg.role === 'user'
                ? 'bg-primary-500 text-white rounded-tr-sm'
                : 'bg-white border border-gray-200 text-ink rounded-tl-sm shadow-card'
            }`}>
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-primary-600" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-primary-500" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl rounded-tl-sm px-4 py-3 shadow-card">
              <Loader2 size={16} className="animate-spin text-primary-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className="mt-4 flex gap-2"
      >
        <input
          className="input flex-1"
          placeholder="Ask about your spending..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={!input.trim() || loading} className="btn-primary px-4">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
