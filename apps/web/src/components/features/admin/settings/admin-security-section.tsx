'use client';

import React, { useState } from 'react';
import {
    ShieldCheck,
    Smartphone,
    Loader2,
    Lock,
    Copy,
    KeyRound,
    ShieldAlert,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
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
            toast.error("Forensic setup failed");
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
            toast.success("MFA Active: Security tier upgraded");
        } catch (e) {
            toast.error("Verification mismatch. Code rejected.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-6">
            <Card className={cn(
                "rounded-[32px] border transition-all duration-500",
                isEnabled ? "border-primary/20 bg-primary/[0.02]" : "border-border/50 bg-card"
            )}>
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
                            <div className={cn(
                                "h-16 w-16 rounded-[22px] flex items-center justify-center shadow-inner shrink-0 transition-all",
                                isEnabled ? "bg-primary text-white scale-110" : "bg-muted text-muted-foreground"
                            )}>
                                {isEnabled ? <ShieldCheck className="h-8 w-8" /> : <Smartphone className="h-8 w-8" />}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-foreground">Multi-Factor Authentication</h3>
                                <p className="text-sm text-muted-foreground font-medium max-w-sm leading-relaxed">
                                    {isEnabled
                                        ? "Your administrative node is protected by Google Authenticator."
                                        : "Protect your root access by linking a hardware-based TOTP device."}
                                </p>
                            </div>
                        </div>

                        {!isEnabled && (
                            <Button
                                onClick={startSetup}
                                disabled={isLoading}
                                className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link Authenticator"}
                            </Button>
                        )}
                        {isEnabled && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest">
                                Status: Active Protection
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showSetup} onOpenChange={setShowSetup}>
                <DialogContent className="rounded-[40px] p-0 overflow-hidden border-none shadow-2xl bg-card max-w-md">
                    <div className="p-10 space-y-8">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Lock className="h-6 w-6" />
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tighter">Secure Your Node</DialogTitle>
                            <p className="text-sm text-muted-foreground">Scan this QR code with Google Authenticator.</p>
                        </div>

                        {setupData && (
                            <div className="space-y-8">
                                <div className="flex justify-center p-6 bg-white rounded-[32px] border-4 border-muted shadow-inner">
                                    <img src={setupData.qrCodeDataUrl} alt="MFA QR" className="w-44 h-44" />
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Manual Entry Secret</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-muted p-3.5 rounded-xl text-xs font-mono break-all border border-border/50">{setupData.secret}</code>
                                            <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-xl" onClick={() => {
                                                navigator.clipboard.writeText(setupData.secret);
                                                toast.success("Secret copied to vault");
                                            }}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Verification Code</label>
                                        <Input
                                            placeholder="000 000"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="h-16 text-center text-3xl font-black tracking-[0.4em] rounded-2xl bg-muted/20 border-none ring-1 ring-border focus-visible:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={verifyAndEnable}
                            disabled={isLoading || code.length !== 6}
                            className="w-full h-16 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm Identity Sync'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", className)}>
            {children}
        </span>
    );
}