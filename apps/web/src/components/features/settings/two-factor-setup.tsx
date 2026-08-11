'use client';

import React, { useState, memo } from 'react';
import {
    ShieldCheck,
    Loader2,
    Lock,
    Copy,
    Check
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { ApiService } from '../../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';
import { OtpInput } from '../../ui/otp-input';
import { motion } from 'framer-motion';

export const TwoFactorSetup = memo(function TwoFactorSetup({ isEnabled: initialEnabled }: { isEnabled: boolean }) {
    const [isEnabled, setIsEnabled] = useState(initialEnabled);
    const [isLoading, setIsLoading] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [showDisable, setShowDisable] = useState(false);

    const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);

    const initSetup = async () => {
        setIsLoading(true);
        try {
            const data = await ApiService.auth.generate2FA();
            setSetupData(data);
            setShowSetup(true);
        } catch (e) {
            toast.error("Something went wrong. Please try again.");
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
            toast.success("Two-factor authentication is now active");
        } catch (e) {
            toast.error("Invalid verification code. Please try again.");
            setVerificationCode('');
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
            toast.success("Two-factor authentication disabled");
        } catch (e) {
            toast.error("Incorrect password");
        } finally {
            setIsLoading(false);
        }
    };

    const copySecret = () => {
        if (!setupData) return;
        navigator.clipboard.writeText(setupData.secret);
        setCopied(true);
        toast.success("Secret key copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <Card className={cn(
                "rounded-3xl border transition-all duration-200 shadow-sm",
                isEnabled ? "border-primary/20 bg-primary/5" : "border-border/40 bg-card"
            )}>
                <CardContent className="p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
                        <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-all",
                            isEnabled ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                            <ShieldCheck className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-foreground">Two-Factor Authentication</h3>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-sm">
                                Protect your account with an additional layer of security using an authenticator app.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant={isEnabled ? "outline" : "default"}
                        onClick={() => isEnabled ? setShowDisable(true) : initSetup()}
                        disabled={isLoading}
                        className={cn(
                            "rounded-3xl h-11 px-6 font-bold text-xs w-full md:w-auto active:scale-95 transition-all",
                            !isEnabled && "shadow-lg shadow-primary/20 border-0"
                        )}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEnabled ? 'Disable protection' : 'Enable protection'}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={showSetup} onOpenChange={(open) => !open && !isLoading && setShowSetup(false)}>
                {/* Logic: Flex column layout with constrained max-height allows internal scrolling on small mobile screens without losing action buttons */}
                <DialogContent className="rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card max-w-md w-[95vw] max-h-[90vh] flex flex-col">
                    <div className="p-5 md:p-8 space-y-6 md:space-y-8 overflow-y-auto no-scrollbar flex-1">
                        <div className="text-center space-y-3">
                            <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight text-center leading-none">Enable Two-Factor</DialogTitle>
                            </DialogHeader>
                            <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed">
                                Scan the QR code below with your authenticator app, or enter the manual key.
                            </p>
                        </div>

                        {setupData && (
                            <div className="flex flex-col items-center gap-6">
                                <div className="p-3 bg-white rounded-3xl border border-muted shadow-sm group">
                                    <motion.img
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        src={setupData.qrCodeDataUrl}
                                        alt="2FA QR Code"
                                        className="w-32 h-32 md:w-40 md:h-40 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                <div className="w-full space-y-6">
                                    <div className="space-y-2 text-center">
                                        <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Manual Key</label>
                                        <div className="flex items-center justify-center gap-2 max-w-[280px] mx-auto min-w-0">
                                            <code className="flex-1 bg-muted/30 py-2.5 px-3 rounded-2xl text-[10px] md:text-xs font-mono text-foreground font-bold shadow-sm truncate border border-border/40">
                                                {setupData.secret}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 shrink-0 rounded-2xl border-border/50 bg-background hover:bg-muted active:scale-95 transition-all"
                                                onClick={copySecret}
                                            >
                                                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <label className="text-xs font-bold text-foreground text-center block">Enter the 6-digit code</label>
                                        <OtpInput
                                            value={verificationCode}
                                            onChange={setVerificationCode}
                                            maxLength={6}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleEnable}
                            disabled={isLoading || verificationCode.length !== 6}
                            className="w-full h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all border-0"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Activate protection'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDisable} onOpenChange={setShowDisable}>
                <DialogContent className="rounded-3xl p-6 md:p-8 max-w-sm w-[95vw] border-none shadow-2xl bg-card">
                    <div className="text-center space-y-3">
                        <div className="h-12 w-12 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto shadow-inner">
                            <Lock className="h-6 w-6" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-center">Disable protection?</DialogTitle>
                        </DialogHeader>
                        <p className="text-xs text-muted-foreground text-center font-medium leading-relaxed">
                            Enter your password to authorize security deactivation.
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <Input
                            type="password"
                            placeholder="Current password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 rounded-3xl"
                        />
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setShowDisable(false)}
                                disabled={isLoading}
                                className="flex-1 rounded-3xl font-bold text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDisable}
                                disabled={isLoading || !password}
                                className="flex-1 h-11 rounded-3xl font-bold text-xs shadow-md border-0 active:scale-95 transition-all"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Deactivate'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
});