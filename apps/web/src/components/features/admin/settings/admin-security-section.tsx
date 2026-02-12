'use client';

import React, { useState } from 'react';
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

export function AdminSecuritySection({ user }: { user: any }) {
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
            toast.error("Failed to initialize security protocol");
        } finally {
            setIsLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        if (code.length !== 6) return;
        setIsLoading(true);
        try {
            await ApiService.auth.enable2FA(code);
            setIsEnabled(true);
            setShowSetup(false);
            toast.success("2FA Enforcement active");
        } catch (e) {
            toast.error("Invalid code. Verification failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const copySecret = () => {
        if (!setupData) return;
        navigator.clipboard.writeText(setupData.secret);
        setCopied(true);
        toast.success("Secret key copied");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl space-y-6">
            <Card className={cn(
                "rounded-3xl border transition-all duration-300",
                isEnabled ? "border-emerald-500/20 bg-emerald-500/[0.01]" : "border-border/40 bg-card"
            )}>
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
                        <div className={cn(
                            "h-14 w-14 rounded-3xl flex items-center justify-center shadow-inner shrink-0 transition-all",
                            isEnabled ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                            {isEnabled ? <ShieldCheck className="h-7 w-7" /> : <Smartphone className="h-7 w-7" />}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground">Google authenticator</h3>
                            <p className="text-xs text-muted-foreground font-medium max-w-sm leading-relaxed">
                                {isEnabled
                                    ? "Administrative node is secured with time-based OTP."
                                    : "Enforce hardware-level security for root access permissions."}
                            </p>
                        </div>
                    </div>

                    {!isEnabled ? (
                        <Button
                            onClick={startSetup}
                            disabled={isLoading}
                            className="rounded-3xl h-12 px-8 font-bold tracking-wider text-[11px] shadow-lg shadow-primary/20 w-full md:w-auto"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Setup 2fa"}
                        </Button>
                    ) : (
                        <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-4 py-2 rounded-3xl font-bold text-[11px] tracking-wider flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Active protection
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showSetup} onOpenChange={setShowSetup}>
                <DialogContent className="rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-card max-w-md">
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="text-center space-y-1">
                            <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3 border border-primary/10">
                                <Lock className="h-6 w-6" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold tracking-tight text-center leading-none">Scan QR code</DialogTitle>
                            </DialogHeader>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                Open Google Authenticator and scan the key to link your admin device.
                            </p>
                        </div>

                        {setupData && (
                            <div className="space-y-6">
                                <div className="flex justify-center p-4 bg-white rounded-3xl border border-muted shadow-inner">
                                    <img src={setupData.qrCodeDataUrl} alt="2FA QR Code" className="w-40 h-40 mix-blend-multiply" />
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Manual secret</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-muted/50 p-3 rounded-2xl text-xs font-mono break-all border border-border/40 flex items-center text-foreground font-bold">
                                                {setupData.secret}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-11 w-11 shrink-0 rounded-2xl border-border/50 bg-background hover:bg-muted"
                                                onClick={copySecret}
                                            >
                                                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-primary ml-2">Enter 6-digit code</label>
                                        <Input
                                            placeholder="000 000"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="h-14 text-center text-2xl font-bold tracking-[0.4em] rounded-2xl bg-muted/20 border-transparent focus-visible:ring-primary/20"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                onClick={verifyAndEnable}
                                disabled={isLoading || code.length !== 6}
                                className="w-full h-12 rounded-3xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Activate protection'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setShowSetup(false)}
                                className="w-full h-10 rounded-3xl font-bold text-xs text-muted-foreground"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}