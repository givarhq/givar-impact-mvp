'use client';

import React, { useState } from 'react';
import {
    ShieldCheck, Smartphone,
    Loader2, Lock, Copy
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { ApiService } from '../../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';

export function TwoFactorSetup({ isEnabled: initialEnabled }: { isEnabled: boolean }) {
    const [isEnabled, setIsEnabled] = useState(initialEnabled);
    const [isLoading, setIsLoading] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [showDisable, setShowDisable] = useState(false);

    const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [password, setPassword] = useState('');

    const initSetup = async () => {
        setIsLoading(true);
        try {
            const data = await ApiService.auth.generate2FA();
            setSetupData(data);
            setShowSetup(true);
        } catch (e) {
            toast.error("Failed to initialize 2FA setup");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnable = async () => {
        if (verificationCode.length !== 6) return;
        setIsLoading(true);
        try {
            await ApiService.auth.enable2FA(verificationCode);
            setIsEnabled(true);
            setShowSetup(false);
            setSetupData(null);
            setVerificationCode('');
            toast.success("Two-Factor Authentication is now active");
        } catch (e) {
            toast.error("Invalid verification code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable = async () => {
        setIsLoading(true);
        try {
            await ApiService.auth.disable2FA(password);
            setIsEnabled(false);
            setShowDisable(false);
            setPassword('');
            toast.success("Two-Factor Authentication disabled");
        } catch (e) {
            toast.error("Incorrect password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className={cn(
                "rounded-[32px] border transition-all duration-500",
                isEnabled ? "border-primary/20 bg-primary/[0.02]" : "border-border/50 bg-card"
            )}>
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
                        <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner",
                            isEnabled ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                            <Smartphone className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-foreground">Two-Factor Authentication</h3>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                Add an extra layer of protection to your account using an authenticator app like Google Authenticator or Authy.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant={isEnabled ? "outline" : "default"}
                        onClick={() => isEnabled ? setShowDisable(true) : initSetup()}
                        disabled={isLoading}
                        className="rounded-xl h-12 px-8 font-bold min-w-[140px]"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={showSetup} onOpenChange={setShowSetup}>
                <DialogContent className="rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-card max-w-md">
                    <div className="p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight text-center">Secure Your Account</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-muted-foreground">Scan the QR code below with your authenticator app.</p>
                        </div>

                        {setupData && (
                            <div className="flex flex-col items-center gap-6">
                                <div className="p-4 bg-white rounded-3xl border-4 border-muted shadow-inner">
                                    <img src={setupData.qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48" />
                                </div>

                                <div className="w-full space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Manual Entry Key</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-muted p-3 rounded-xl text-xs font-mono break-all border border-border/50">{setupData.secret}</code>
                                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl" onClick={() => {
                                                navigator.clipboard.writeText(setupData.secret);
                                                toast.success("Code copied");
                                            }}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Verification Code</label>
                                        <Input
                                            placeholder="000 000"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="h-14 text-center text-2xl font-black tracking-[0.5em] rounded-2xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleEnable}
                            disabled={isLoading || verificationCode.length !== 6}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify & Activate'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDisable} onOpenChange={setShowDisable}>
                <DialogContent className="rounded-[32px] p-8 max-w-sm">
                    <div className="text-center space-y-4">
                        <div className="h-16 w-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                            <Lock className="h-8 w-8" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-center">Disable Security Layer?</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground text-center">Please enter your password to confirm deactivation.</p>
                    </div>

                    <div className="space-y-6 pt-4">
                        <Input
                            type="password"
                            placeholder="Current Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 rounded-xl"
                        />
                        <Button
                            variant="destructive"
                            onClick={handleDisable}
                            disabled={isLoading || !password}
                            className="w-full h-12 rounded-xl font-bold shadow-lg shadow-destructive/10"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Deactivation'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}