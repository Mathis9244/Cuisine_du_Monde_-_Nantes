import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Restaurant } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

interface AIResearchProps {
  restaurants: Restaurant[];
}

const ai = new GoogleGenAI({ apiKey: (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '' });

const AIResearch: React.FC<AIResearchProps> = ({ restaurants }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I'm your Nantes culinary assistant. Ask me anything about the restaurants in our circle, or for general food recommendations in Nantes!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = `You are an expert culinary assistant for Nantes, France. Use the following list of restaurants as your primary knowledge base to recommend places to the user. Be concise, friendly, and helpful.
      
Restaurants context:
${JSON.stringify(restaurants, null, 2)}

User question: ${userMessage.content}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: context,
      });

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text || "I'm sorry, I couldn't generate a response."
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I'm sorry, I encountered an error while trying to think. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[800px] bg-[#0d2624] border border-[#1a3b38] rounded-[2.5rem] overflow-hidden">
      <div className="p-6 border-b border-[#1a3b38] bg-[#081c1b]/50">
        <h2 className="text-2xl font-black text-[#ff9f1c] uppercase tracking-widest flex items-center gap-3">
          <Bot size={28} />
          AI Research
        </h2>
        <p className="text-[#cbf3f0]/60 text-xs font-bold uppercase tracking-widest mt-2">
          Ask about flavors, places, or recommendations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-[#ff9f1c] text-[#081c1b]' : 'bg-[#2ec4b6]/20 text-[#2ec4b6]'
            }`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-[#ff9f1c]/10 border border-[#ff9f1c]/20 text-white rounded-tr-none' 
                : 'bg-[#1a3b38]/50 border border-[#1a3b38] text-[#cbf3f0] rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#2ec4b6]/20 text-[#2ec4b6] flex items-center justify-center shrink-0">
              <Bot size={20} />
            </div>
            <div className="bg-[#1a3b38]/50 border border-[#1a3b38] rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#2ec4b6]" />
              <span className="text-xs text-[#cbf3f0]/60 uppercase tracking-widest font-bold">Thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#1a3b38] bg-[#081c1b]/50">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a restaurant..."
            className="w-full bg-[#0d2624] border border-[#1a3b38] rounded-full py-4 pl-6 pr-14 text-sm text-white placeholder-[#cbf3f0]/30 focus:outline-none focus:border-[#2ec4b6] transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 w-10 h-10 bg-[#ff9f1c] text-[#081c1b] rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
          >
            <Send size={18} className="ml-[-2px]" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIResearch;

