import { useState } from "react";
import { MessageCircle, X, Send, Loader2, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your Simrata support assistant. How can I help you today?' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  const { isLoading, mutateAsync: sendMessage } = useQuery({
    queryKey: ['chat-support', currentMessage],
    queryFn: async () => {
      if (!currentMessage.trim()) return null;
      
      try {
        const { data, error } = await supabase.functions.invoke('chat-support', {
          body: { message: currentMessage }
        });
        
        if (error) throw error;
        return data.response;
      } catch (err) {
        console.error('Error in chat support:', err);
        return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
      }
    },
    enabled: false
  });

  const handleSend = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: currentMessage };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    const response = await sendMessage();
    if (response) {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-[350px] shadow-lg transition-all duration-200 ${
      minimized ? 'h-[60px]' : 'h-[500px]'
    }`}>
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Simrata Support</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMinimized(!minimized)}
          >
            <MinusCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!minimized && (
        <>
          <ScrollArea className="flex-1 p-4 h-[380px]">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !currentMessage.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};