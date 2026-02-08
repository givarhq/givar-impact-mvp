'use client';

import React, { useState } from 'react';
import {
    ShieldCheck, Smartphone, Loader2, Lock, Copy
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
            toast.success("2FA Enforcement Active");
        } catch (e) {
            toast.error("Invalid code. Verification failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-6">
            <Card className={cn(
                "rounded-[32px] border transition-all duration-500",
                isEnabled ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-border/50 bg-card"
            )}>
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
                        <div className={cn(
                            "h-16 w-16 rounded-[24px] flex items-center justify-center shadow-inner shrink-0 transition-all",
                            isEnabled ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                            {isEnabled ? <ShieldCheck className="h-8 w-8" /> : <Smartphone className="h-8 w-8" />}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-foreground">Google Authenticator</h3>
                            <p className="text-sm text-muted-foreground font-medium max-w-sm leading-relaxed">
                                {isEnabled
                                    ? "Administrative node is secured with time-based OTP."
                                    : "Enforce hardware-level security for root access."}
                            </p>
                        </div>
                    </div>

                    {!isEnabled ? (
                        <Button
                            onClick={startSetup}
                            disabled={isLoading}
                            className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Setup 2FA"}
                        </Button>
                    ) : (
                        <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Active
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showSetup} onOpenChange={setShowSetup}>
                <DialogContent className="rounded-[40px] p-0 overflow-hidden border-none shadow-2xl bg-card max-w-md">
                    <div className="p-10 space-y-8">
                        <div className="text-center space-y-2">
                            <div className="h-14 w-14 bg-primary/10 text-primary rounded-[20px] flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                <Lock className="h-7 w-7" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tighter text-center">Scan QR Code</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                Open Google Authenticator and scan the code below to link your admin device.
                            </p>
                        </div>

                        {setupData && (
                            <div className="space-y-8">
                                <div className="flex justify-center p-6 bg-white rounded-[32px] border-4 border-muted/50 shadow-inner">
                                    <img src={setupData.qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48 mix-blend-multiply" />
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Manual Secret</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-muted/50 p-4 rounded-2xl text-xs font-mono break-all border border-border/50 flex items-center text-foreground font-bold">
                                                {setupData.secret}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-auto w-14 shrink-0 rounded-2xl border-border/50 hover:bg-muted"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(setupData.secret);
                                                    toast.success("Secret key copied");
                                                }}
                                            >
                                                <Copy className="h-5 w-5 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-2">Enter 6-Digit Code</label>
                                        <Input
                                            placeholder="000 000"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl bg-primary/5 border-primary/20 focus-visible:ring-primary/30"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={verifyAndEnable}
                            disabled={isLoading || code.length !== 6}
                            className="w-full h-16 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Activate Protection'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}