'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { MessageSquare, Send, Loader2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { ApiService } from '../../../services/api';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
    author: {
        firstName: string;
        lastName: string;
        role: string;
    };
}

interface FeedbackThreadProps {
    proposalId?: string;
    projectId?: string;
    title?: string;
}

export const FeedbackThread = memo(function FeedbackThread({ proposalId, projectId, title = "Feedback And Conversation" }: FeedbackThreadProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        try {
            const data = await ApiService.communication.getThread({ proposalId, projectId });
            setMessages(data || []);
        } catch (error) {
            console.error("Could not load the conversation history");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 15000);
        return () => clearInterval(interval);
    }, [proposalId, projectId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        const content = newMessage.trim();
        if (!content || isSending) return;

        setIsSending(true);
        try {
            const sent = await ApiService.communication.sendMessage({
                content,
                proposalId,
                projectId
            });
            setMessages(prev => [...prev, sent]);
            setNewMessage('');

            const textarea = document.getElementById('message-input');
            textarea?.focus();
        } catch (error) {
            toast.error("Your Message Could Not Be Sent. Please Try Again.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card id="communication-thread" className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden flex flex-col h-[500px] scroll-mt-24">
            <CardHeader className="bg-muted/30 border-b border-border/40 p-5 shrink-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" /> {title}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar bg-muted/[0.02]" ref={scrollRef}>
                {isLoading && messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-40">
                        <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-medium">No messages yet. Start the conversation below.</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "flex flex-col max-w-[85%] space-y-1",
                                    msg.isAdmin ? "mr-auto" : "ml-auto items-end"
                                )}
                            >
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[10px] font-bold text-muted-foreground tracking-tight">
                                        {msg.author.firstName} {msg.author.lastName}
                                    </span>
                                    {msg.isAdmin && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold bg-primary/10 text-primary border border-primary/20">
                                            Givar Admin
                                        </span>
                                    )}
                                </div>
                                <div className={cn(
                                    "p-3.5 rounded-[22px] text-xs leading-relaxed font-medium shadow-sm",
                                    msg.isAdmin
                                        ? "bg-muted/60 text-foreground rounded-tl-none border border-border/40"
                                        : "bg-primary text-white rounded-tr-none"
                                )}>
                                    {msg.content}
                                </div>
                                <div className="flex items-center gap-1 px-1 opacity-40">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span className="text-[9px] font-bold">
                                        {formatDate(msg.createdAt).split(',')[1]}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </CardContent>

            <div className="p-4 bg-background border-t border-border/40 shrink-0">
                <div className="flex items-center gap-2">
                    <Textarea
                        id="message-input"
                        placeholder="Write A Message..."
                        className="min-h-[40px] max-h-[140px] text-xs"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />

                    <Button
                        type="button"
                        disabled={!newMessage.trim() || isSending}
                        onClick={handleSend}
                        className="h-10 w-10 shrink-0 rounded-full shadow-md transition-all active:scale-95 p-0 flex items-center justify-center border-0"
                    >
                        {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 ml-0.5" />
                        )}
                    </Button>
                </div>

                <div className="mt-3 px-1">
                    <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                        Your conversation is saved as part of the permanent project history.
                    </p>
                </div>
            </div>
        </Card>
    );
});