'use client';

import React, { useState, memo } from 'react';
import {
    ShieldCheck, Smartphone, Loader2, Lock, Copy, Check
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Card, CardContent } from '../../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/dialog';
import { ApiService } from '../../../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminSecuritySection = memo(function AdminSecuritySection({ user }: { user: any }) {
    const [isEnabled, setIsEnabled] = useState(user.twoFactorEnabled);
    const [isLoading, setIsLoading] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
    const [code, setCode] = useState('');
    const [copied, setCopied] = useState(false);

    const startSetup = async () => {
        setIsLoading(true);
        try {
            const data = await ApiService.auth.generate2FA();
            setSetupData(data);
            setShowSetup(true);
        } catch (e) {
            toast.error("We Couldn't Start The Security Setup Right Now");
        } finally {
            setIsLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        if (code.length !== 6) return;
        setIsLoading(true);
        const toastId = toast.loading("Verifying Security Code...");
        try {
            await ApiService.auth.enable2FA(code);
            setIsEnabled(true);
            setShowSetup(false);
            toast.success("Security Verification Is Now Active", { id: toastId });
        } catch (e) {
            toast.error("That Code Didn't Match. Please Try Again.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const copySecret = () => {
        if (!setupData) return;
        navigator.clipboard.writeText(setupData.secret);
        setCopied(true);
        toast.success("Secret Key Copied To Clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl space-y-6">
            <Card className={cn(
                "rounded-3xl border transition-all duration-300 shadow-sm",
                isEnabled ? "border-emerald-500/20 bg-emerald-500/[0.01]" : "border-border/40 bg-card"
            )}>
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
                        <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-all",
                            isEnabled ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                            {isEnabled ? <ShieldCheck className="h-7 w-7" /> : <Smartphone className="h-7 w-7" />}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground">Authenticator Protection</h3>
                            <p className="text-xs text-muted-foreground font-medium max-w-sm leading-relaxed">
                                {isEnabled
                                    ? "Your administrative account is fully protected with a secure verification code."
                                    : "Add an extra layer of protection by requiring a verification code whenever you log in."}
                            </p>
                        </div>
                    </div>

                    {!isEnabled ? (
                        <Button
                            onClick={startSetup}
                            disabled={isLoading}
                            className="rounded-3xl h-12 px-8 font-bold tracking-widest text-xs shadow-lg shadow-primary/20 w-full md:w-auto border-0 active:scale-95 transition-all"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Up 2FA"}
                        </Button>
                    ) : (
                        <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-5 py-2.5 rounded-3xl font-bold text-[11px] tracking-widest flex items-center gap-2 shadow-sm">
                            <ShieldCheck className="h-4 w-4" /> Active Protection
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showSetup} onOpenChange={setShowSetup}>
                <DialogContent className="rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card max-w-md">
                    <div className="p-8 md:p-10 space-y-8">
                        <div className="text-center space-y-2">
                            <div className="h-14 w-14 bg-primary/10 text-primary rounded-[22px] flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
                                <Lock className="h-7 w-7" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold tracking-tight text-center leading-none">Scan Your Key</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                Open your preferred authenticator app & scan this QR code to link your device.
                            </p>
                        </div>

                        {setupData && (
                            <div className="space-y-8">
                                <div className="flex justify-center p-6 bg-white rounded-3xl border border-muted shadow-inner group">
                                    <motion.img
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        src={setupData.qrCodeDataUrl}
                                        alt="QR Code"
                                        className="w-44 h-44 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold tracking-widest text-muted-foreground ml-2 uppercase">Manual Entry Key</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-muted/50 p-4 rounded-2xl text-xs font-mono break-all border border-border/40 flex items-center text-foreground font-bold shadow-inner">
                                                {setupData.secret}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-12 w-12 shrink-0 rounded-2xl border-border/50 bg-background hover:bg-muted active:scale-90 transition-all"
                                                onClick={copySecret}
                                            >
                                                {copied ? <Check className="h-4.5 w-4.5 text-emerald-500" /> : <Copy className="h-4.5 w-4.5 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold tracking-widest text-primary ml-2 uppercase">Enter 6-Digit Code</label>
                                        <Input
                                            placeholder="000 000"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl bg-muted/20 border-transparent focus-visible:ring-primary/20 shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                onClick={verifyAndEnable}
                                disabled={isLoading || code.length !== 6}
                                className="w-full h-14 rounded-3xl font-bold tracking-widest text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.98] border-0"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Turn On Protection'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowSetup(false)}
                                className="w-full h-10 rounded-3xl font-bold text-xs text-muted-foreground hover:text-foreground"
                            >
                                Not Now
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
});