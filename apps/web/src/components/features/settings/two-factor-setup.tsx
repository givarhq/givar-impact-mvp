'use client';

import React, { useState } from 'react';
import {
    Smartphone,
    Loader2,
    Lock,
    Copy,
    CheckCircle2
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
        <div className="space-y-4 md:space-y-6">
            <Card className={cn(
                "rounded-3xl border transition-all duration-200",
                isEnabled ? "border-primary/20 bg-primary/5" : "border-border/40 bg-card"
            )}>
                <CardContent className="p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                        <div className={cn(
                            "h-12 w-12 rounded-3xl flex items-center justify-center shadow-sm",
                            isEnabled ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-bold text-sm text-foreground">Two-Factor Authentication</h3>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-sm">
                                Protect your impact node with an additional layer of hardware-based security.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant={isEnabled ? "outline" : "default"}
                        onClick={() => isEnabled ? setShowDisable(true) : initSetup()}
                        disabled={isLoading}
                        className="rounded-3xl h-10 px-6 font-bold text-xs w-full md:w-auto"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={showSetup} onOpenChange={setShowSetup}>
                <DialogContent className="rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card max-w-md">
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="text-center space-y-1">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold tracking-tight text-center">Secure Your Node</DialogTitle>
                            </DialogHeader>
                            <p className="text-xs text-muted-foreground">Scan this cryptographic key with your authenticator app.</p>
                        </div>

                        {setupData && (
                            <div className="flex flex-col items-center gap-6">
                                <div className="p-4 bg-white rounded-3xl border border-muted shadow-inner">
                                    <img src={setupData.qrCodeDataUrl} alt="2FA QR Code" className="w-40 h-40" />
                                </div>

                                <div className="w-full space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Manual Key</label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 bg-muted p-3 rounded-3xl text-xs font-mono break-all border border-border/40 flex items-center">{setupData.secret}</code>
                                            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-3xl" onClick={() => {
                                                navigator.clipboard.writeText(setupData.secret);
                                                toast.success("Secret copied");
                                            }}>
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-widest text-primary ml-1">Authentication Code</label>
                                        <Input
                                            placeholder="000 000"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="h-12 text-center text-2xl font-bold tracking-[0.4em] rounded-3xl bg-muted/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleEnable}
                            disabled={isLoading || verificationCode.length !== 6}
                            className="w-full h-12 rounded-3xl font-bold text-xs uppercase tracking-widest shadow-sm"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Activate Protection'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDisable} onOpenChange={setShowDisable}>
                <DialogContent className="rounded-3xl p-6 md:p-8 max-w-sm">
                    <div className="text-center space-y-3">
                        <div className="h-12 w-12 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                            <Lock className="h-6 w-6" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-center">Disable 2FA?</DialogTitle>
                        </DialogHeader>
                        <p className="text-xs text-muted-foreground text-center">Enter your password to authorize security deactivation.</p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <Input
                            type="password"
                            placeholder="Current Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-10 rounded-3xl"
                        />
                        <Button
                            variant="destructive"
                            onClick={handleDisable}
                            disabled={isLoading || !password}
                            className="w-full h-11 rounded-3xl font-bold text-xs"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Deactivation'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}