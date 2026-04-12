"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { MessageSquare, Send, User, Loader2, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Thread {
  id: number;
  otherPartyName: string;
  itemTitle: string | null;
  latestMessage: string;
  updatedAt: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
}

function MessagesContent() {
  const { user, loading: sessionLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        const filtered = (data.users || []).filter((u: any) => u.id !== user?.id);
        setSearchResults(filtered);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const startNewChat = async (recipient: any) => {
    setSearchQuery("");
    setIsSearching(false);
    
    try {
      const res = await fetch("/api/messages/threads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: recipient.id })
      });
      const data = await res.json();
      if (data.threadId) {
        await loadThreads();
        setActiveThreadId(data.threadId);
        router.push(`/messages?thread=${data.threadId}`);
      }
    } catch {
      toast.error("Failed to start chat.");
    }
  };

  // Load threads
  const loadThreads = async () => {
    try {
      const res = await fetch("/api/messages/threads");
      const data = await res.json();
      setThreads(data.threads || []);
      
      const queryId = searchParams.get("thread");
      if (queryId && !activeThreadId) {
        setActiveThreadId(parseInt(queryId, 10));
      } else if (data.threads?.length > 0 && !activeThreadId && !queryId) {
        setActiveThreadId(data.threads[0].id);
      }
    } catch {
      toast.error("Failed to load threads");
    } finally {
      setThreadsLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionLoading && user) {
      loadThreads();
    }
  }, [sessionLoading, user]);

  // Load active thread messages (with polling)
  useEffect(() => {
    if (!activeThreadId) return;
    
    let isSubscribed = true;
    let pollTimer: NodeJS.Timeout;

    const loadMsgs = async () => {
      try {
        const res = await fetch(`/api/messages/${activeThreadId}`);
        const data = await res.json();
        if (isSubscribed) {
          setMessages(prev => {
            const newMsgs = data.messages || [];
            if (prev.length !== newMsgs.length) {
              setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
              }, 100);
            }
            return newMsgs;
          });
        }
      } catch {
        // silent fail on poll
      } finally {
        if (isSubscribed) setMsgsLoading(false);
      }
    };
    
    setMsgsLoading(true);
    loadMsgs();
    pollTimer = setInterval(loadMsgs, 2000);
    
    return () => { 
      isSubscribed = false; 
      clearInterval(pollTimer);
    };
  }, [activeThreadId]);

  const handleSend = async () => {
    if (!input.trim() || !activeThreadId) return;
    
    const content = input.trim();
    setInput("");
    setSending(true);
    
    // Optimistic update
    const tempMsg: Message = {
      id: Date.now(),
      content,
      senderId: user!.id,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThreadId, content }),
      });
      if (!res.ok) throw new Error("Failed");
      loadThreads(); // Refresh thread preview
    } catch {
      toast.error("Failed to send message");
      // Remove optimistic message
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    } finally {
      setSending(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <MessageSquare className="h-7 w-7 text-green-600" />
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Messages</h1>
      </div>

      <div className="glass-card border rounded-2xl overflow-hidden flex flex-1 min-h-0 shadow-sm" style={{ borderColor: "var(--border)" }}>
        {/* Left Pane: Thread List */}
        <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 shrink-0 overflow-visible">
            <h2 className="font-semibold text-gray-900 mb-3">Conversations</h2>
            
            <div className="relative">
              <Input 
                placeholder="Search users to chat..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-gray-200 focus:ring-green-500 rounded-full pl-9 text-sm h-10 w-full"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              
              {isSearching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-[60] max-h-48 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-xs text-center text-gray-400">No matching users</div>
                  ) : (
                    searchResults.map(u => (
                      <button 
                        key={u.id}
                        onClick={() => startNewChat(u)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-indigo-700" />
                        </div>
                        <span className="truncate flex-1 font-medium text-gray-800">{u.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {threadsLoading ? (
              <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" /></div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No conversations yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {threads.map(thread => (
                  <button
                    key={thread.id}
                    onClick={() => { setActiveThreadId(thread.id); router.push(`/messages?thread=${thread.id}`); }}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                      activeThreadId === thread.id ? 'bg-green-50/50 border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="font-semibold text-gray-900 truncate pr-2">{thread.otherPartyName}</p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(thread.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {thread.itemTitle && (
                        <p className="text-[10px] font-medium text-green-600 truncate mb-1 bg-green-50 inline-block px-1.5 py-0.5 rounded">
                          {thread.itemTitle}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 truncate">{thread.latestMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread */}
        <div className={`w-full md:w-2/3 flex flex-col ${!activeThreadId ? 'hidden md:flex' : 'flex'}`}>
          {!activeThreadId ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 text-gray-400 p-8 text-center">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => { setActiveThreadId(null); router.push("/messages"); }}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{activeThread?.otherPartyName}</h2>
                  {activeThread?.itemTitle && (
                    <p className="text-xs text-green-600 font-medium">Re: {activeThread.itemTitle}</p>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                {msgsLoading ? (
                  <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">Send a message to start the conversation</div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === user?.id;
                    const showAvatar = i === 0 || messages[i-1].senderId !== msg.senderId;
                    
                    return (
                      <div key={msg.id} className={`flex gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                        {showAvatar ? (
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 self-end ${isMe ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            <User className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="w-8 shrink-0" />
                        )}
                        <div
                          className={`max-w-[70%] rounded-3xl px-4 py-2.5 text-[15px] whitespace-pre-wrap shadow-sm ${
                            isMe 
                              ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-br-sm" 
                              : "bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-sm"
                          }`}
                        >
                          {msg.content}
                          <div className={`text-[10px] mt-1 text-right ${isMe ? "text-white/80" : "text-gray-400"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || sending} className="bg-green-600 hover:bg-green-700 shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
