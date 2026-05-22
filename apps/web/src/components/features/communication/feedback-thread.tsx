'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, Loader2, Clock, PlusCircle, Paperclip, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { ApiService } from '../../../services/api';
import { formatDate, formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
    metadata?: any;
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
    vendors?: any[];
    projectCurrency?: string;
    isOrganizer?: boolean;
}

export const FeedbackThread = memo(function FeedbackThread({
    proposalId,
    projectId,
    title = "Feedback & Conversation",
    vendors = [],
    projectCurrency = "NGN",
    isOrganizer = false
}: FeedbackThreadProps) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Identity checking for Admin actions
    const [isAdminViewer, setIsAdminViewer] = useState(false);

    // Amendment Modal State
    const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
    const [amendDesc, setAmendDesc] = useState('');
    const [amendAmount, setAmendAmount] = useState('');
    const [amendVendorId, setAmendVendorId] = useState('');
    const [newVendorName, setNewVendorName] = useState('');
    const [newVendorEmail, setNewVendorEmail] = useState('');
    const [newVendorPhone, setNewVendorPhone] = useState('');
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);

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
        const userCookie = getCookie('givar_user');
        if (userCookie) {
            try {
                const user = JSON.parse(userCookie as string);
                setIsAdminViewer(user.role === 'ADMIN' || user.role === 'SUPERADMIN');
            } catch (e) { }
        }

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

    const submitAmendmentRequest = async () => {
        if (!amendDesc.trim() || !amendAmount || !amendVendorId || !invoiceFile) {
            return toast.error("Please complete all required fields and attach an invoice.");
        }
        if (amendVendorId === 'NEW' && !newVendorName.trim()) {
            return toast.error("Please provide the name of the new vendor.");
        }

        setIsSending(true);
        const toastId = toast.loading("Encrypting invoice and sending request...");

        try {
            // 1. Upload Invoice Securely
            const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({
                fileType: invoiceFile.type,
                useCase: 'docs'
            });

            await fetch(uploadUrl, {
                method: 'PUT',
                body: invoiceFile,
                headers: { 'Content-Type': invoiceFile.type }
            });

            // 2. Format Amount to Minor Units
            const rawNum = Number(parseFormattedNumber(amendAmount));
            const amountMinor = Math.round(rawNum * 100);

            // 3. Construct Metadata Payload
            const metadata = {
                amendmentRequest: {
                    expenseDesc: amendDesc.trim(),
                    amount: amountMinor.toString(),
                    vendorId: amendVendorId,
                    newVendorName: amendVendorId === 'NEW' ? newVendorName.trim() : undefined,
                    newVendorEmail: amendVendorId === 'NEW' ? newVendorEmail.trim() : undefined,
                    newVendorPhone: amendVendorId === 'NEW' ? newVendorPhone.trim() : undefined,
                    invoiceKey: key
                }
            };

            // 4. Send Message
            const sent = await ApiService.communication.sendMessage({
                content: `Proposed new funding item: ${amendDesc.trim()}`,
                proposalId,
                projectId,
                metadata
            });

            setMessages(prev => [...prev, sent]);
            toast.success("Funding amendment requested successfully", { id: toastId });

            // Reset modal
            setIsAmendmentModalOpen(false);
            setAmendDesc('');
            setAmendAmount('');
            setAmendVendorId('');
            setNewVendorName('');
            setNewVendorEmail('');
            setNewVendorPhone('');
            setInvoiceFile(null);

        } catch (e) {
            toast.error("Failed to submit request", { id: toastId });
        } finally {
            setIsSending(false);
        }
    };

    const handleApplyAmendment = (req: any) => {
        const payload = encodeURIComponent(JSON.stringify(req));
        router.push(`/admin/projects/${projectId}/edit?tab=details&applyAmendment=${payload}`);
    };

    const viewSecureInvoice = async (key: string) => {
        const toastId = toast.loading('Decrypting asset...');
        try {
            const contextId = projectId || proposalId;
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, contextId!);
            toast.dismiss(toastId);
            window.open(viewUrl, '_blank');
        } catch (e) {
            toast.error('Access denied', { id: toastId });
        }
    };

    return (
        <Card id="communication-thread" className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden flex flex-col h-[550px] scroll-mt-24">
            <CardHeader className="bg-muted/30 border-b border-border/40 p-5 shrink-0 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" /> {title}
                </CardTitle>
                {isOrganizer && projectId && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-3xl text-xs font-bold gap-1.5 shadow-sm active:scale-95 transition-all"
                        onClick={() => setIsAmendmentModalOpen(true)}
                    >
                        <PlusCircle className="h-3.5 w-3.5" /> Request Amendment
                    </Button>
                )}
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
                        {messages.map((msg) => {
                            const isAmendment = !!msg.metadata?.amendmentRequest;
                            const req = msg.metadata?.amendmentRequest;

                            return (
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

                                    {/* Embedded Amendment Request Card */}
                                    {isAmendment && req && (
                                        <div className="mt-2 w-full max-w-sm rounded-[20px] bg-background border border-border/50 shadow-sm p-4 text-left">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Amendment Request</span>
                                            </div>
                                            <div className="space-y-2 mb-4">
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground font-bold">Item requested</p>
                                                    <p className="text-xs font-bold text-foreground">{req.expenseDesc}</p>
                                                </div>
                                                <div className="flex justify-between">
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground font-bold">Cost</p>
                                                        <p className="text-xs font-bold text-foreground">{(Number(req.amount) / 100).toLocaleString()} {projectCurrency}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-muted-foreground font-bold">Recipient</p>
                                                        <p className="text-xs font-bold text-foreground">
                                                            {req.vendorId === 'NEW' ? req.newVendorName : (vendors.find(v => v.id === req.vendorId)?.name || 'Unknown Vendor')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => viewSecureInvoice(req.invoiceKey)}
                                                    className="w-full rounded-2xl text-[11px] font-bold h-8 border border-border/40 shadow-none bg-muted/50 hover:bg-muted"
                                                >
                                                    View Invoice
                                                </Button>
                                                {isAdminViewer && projectId && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApplyAmendment(req)}
                                                        className="w-full rounded-2xl text-[11px] font-bold h-8 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                                                    >
                                                        Review & Apply Draft
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1 px-1 opacity-40">
                                        <Clock className="h-2.5 w-2.5" />
                                        <span className="text-[9px] font-bold">
                                            {formatDate(msg.createdAt).split(',')[1]}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </CardContent>

            <div className="p-4 bg-background border-t border-border/40 shrink-0">
                <div className="flex items-center gap-2">
                    <Textarea
                        id="message-input"
                        placeholder="Write a message..."
                        className="min-h-[40px] max-h-[140px] text-xs bg-muted/20"
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

            {/* Amendment Modal */}
            <Dialog open={isAmendmentModalOpen} onOpenChange={(open) => !open && !isSending && setIsAmendmentModalOpen(false)}>
                <DialogContent className="rounded-3xl border-none shadow-2xl p-6 md:p-8 bg-card max-w-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-lg font-bold text-foreground">Request Funding Amendment</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">Expense Description</label>
                            <Input
                                placeholder="e.g. Post-surgery dialysis required"
                                value={amendDesc}
                                onChange={(e) => setAmendDesc(e.target.value)}
                                className="h-11 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm"
                                disabled={isSending}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">Amount Required ({projectCurrency})</label>
                            <Input
                                placeholder="0.00"
                                value={formatNumberInput(amendAmount)}
                                onChange={(e) => setAmendAmount(e.target.value)}
                                className="h-11 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-bold tabular-nums"
                                disabled={isSending}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">Recipient (Vendor)</label>
                            <Select value={amendVendorId} onValueChange={setAmendVendorId} disabled={isSending}>
                                <SelectTrigger className="h-11 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm">
                                    <SelectValue placeholder="Select existing or add new..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-xl border-border/40">
                                    {vendors.map(v => (
                                        <SelectItem key={v.id} value={v.id} className="text-xs py-2.5 font-bold">{v.name}</SelectItem>
                                    ))}
                                    <SelectItem value="NEW" className="text-xs py-2.5 font-bold text-primary">+ Add New Vendor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <AnimatePresence>
                            {amendVendorId === 'NEW' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="p-4 rounded-2xl bg-muted/10 border border-border/40 space-y-3 overflow-hidden"
                                >
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-muted-foreground ml-1">Vendor Name</label>
                                        <Input
                                            placeholder="Hospital or Provider Name"
                                            value={newVendorName}
                                            onChange={(e) => setNewVendorName(e.target.value)}
                                            className="h-10 rounded-xl bg-background text-xs"
                                            disabled={isSending}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground ml-1">Email (Optional)</label>
                                            <Input
                                                placeholder="vendor@example.com"
                                                value={newVendorEmail}
                                                onChange={(e) => setNewVendorEmail(e.target.value)}
                                                className="h-10 rounded-xl bg-background text-xs"
                                                disabled={isSending}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground ml-1">Phone (Optional)</label>
                                            <Input
                                                placeholder="+234..."
                                                value={newVendorPhone}
                                                onChange={(e) => setNewVendorPhone(e.target.value)}
                                                className="h-10 rounded-xl bg-background text-xs"
                                                disabled={isSending}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">Scanned Bill / Invoice</label>
                            {invoiceFile ? (
                                <div className="flex items-center justify-between p-3 bg-muted/20 border border-border/40 rounded-2xl">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <span className="text-xs font-bold text-foreground truncate">{invoiceFile.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setInvoiceFile(null)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive shrink-0">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <label className={cn(
                                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/60 rounded-2xl cursor-pointer bg-muted/5 hover:bg-muted/20 transition-all",
                                    isSending && "opacity-50 pointer-events-none"
                                )}>
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background border border-border/40 mb-2 shadow-sm">
                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground">Attach document (PDF/Image)</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,image/jpeg,image/png,image/webp"
                                        onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                                        disabled={isSending}
                                    />
                                </label>
                            )}
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={submitAmendmentRequest}
                                disabled={isSending || !amendDesc || !amendAmount || !amendVendorId || !invoiceFile || (amendVendorId === 'NEW' && !newVendorName)}
                                className="w-full h-12 rounded-3xl font-bold text-xs shadow-lg shadow-primary/20 bg-primary text-white hover:bg-primary/90 transition-all active:scale-[0.98]"
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request to Admin"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
});