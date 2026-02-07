'use client';

import React, { useState } from 'react';
import {
    AlertTriangle, Trash2, Loader2, Lock,
    ShieldAlert, XCircle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { deleteCookie } from 'cookies-next';

export function DangerZone() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!password) return toast.error("Password required for authorisation");

        setIsLoading(true);
        try {
            await ApiService.auth.deleteAccount(password);

            // Atomic Cleanup
            deleteCookie('givar_token');
            deleteCookie('givar_user');

            toast.success("Account successfully purged from ledger");
            window.location.href = '/';
        } catch (error: any) {
            const message = error.response?.data?.message || "Purge rejected by ledger nodes";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="pt-8 border-t border-border/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[32px] bg-destructive/[0.02] border border-destructive/20 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5" /> Danger Zone
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-xl leading-relaxed">
                        Permanently delete your identity and wallet from the Givar platform. This action is forensic and irreversible. Historical project data cannot be removed.
                    </p>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => setIsDialogOpen(true)}
                    className="h-12 px-8 rounded-xl font-bold gap-2 shadow-lg shadow-destructive/10"
                >
                    <Trash2 className="h-4 w-4" /> Purge Account
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-card">
                    <div className="p-8 space-y-6">
                        <div className="text-center space-y-4">
                            <div className="h-16 w-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-inner">
                                <XCircle className="h-8 w-8" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight text-center">Identity Purge Protocol</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Enter your account password to authorize the permanent removal of your node from the Givar Impact network.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                type="password"
                                label="Security Password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12"
                                autoFocus
                            />

                            <div className="p-4 rounded-xl bg-muted/50 border border-border text-[11px] text-muted-foreground leading-relaxed flex gap-3">
                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                <span>Note: If you have active project launches, this action will be rejected to maintain financial audit integrity.</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-12 font-bold">Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isLoading || !password}
                                className="rounded-2xl h-12 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-destructive/20"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Purge'}
                            </Button>
                        </div>
                    </div>
                    <div className="bg-muted/30 py-3 text-center border-t border-border/50">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Final Verification Gate</span>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}