'use client';

import React, { useState, memo } from 'react';
import {
    Trash2, Loader2,
    ShieldAlert, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';

export const DangerZone = memo(function DangerZone() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!password) return toast.error("Password required to authorize deletion");

        setIsLoading(true);
        try {
            await ApiService.auth.deleteAccount(password);
            toast.success("Account successfully deleted");

            // Logic: Let the Next.js server handle the strict cleanup of HttpOnly cookies
            window.location.href = '/api/auth/clear-session?reason=account_deleted';
        } catch (error: any) {
            const message = error.response?.data?.message || "Deletion failed. Check your credentials.";
            toast.error(message);
            setIsLoading(false);
        }
    };

    return (
        <div className="pt-6 border-t border-border/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 rounded-3xl bg-destructive/5 border border-destructive/10 shadow-sm">
                <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" /> Danger Zone
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium max-w-lg leading-relaxed">
                        Permanently remove your account & data. This action is irreversible. Historical donation records are preserved for ledger transparency.
                    </p>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => setIsDialogOpen(true)}
                    className="h-9 rounded-3xl px-6 font-bold text-xs shadow-sm active:scale-95 transition-all"
                >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Account
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card max-w-sm">
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                                <XCircle className="h-6 w-6" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold tracking-tight text-center">Delete Account</DialogTitle>
                            </DialogHeader>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Enter your password to authorize permanent removal from Givar.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                type="password"
                                label="Confirm Password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-10 rounded-3xl bg-muted/20"
                            />

                            <div className="p-3.5 rounded-3xl bg-amber-50 border border-amber-100 text-xs text-amber-700 leading-relaxed flex gap-2.5">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>Note: Accounts with active projects are restricted from deletion to maintain donor trust.</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-3xl h-10 text-xs font-bold border-border/60">Cancel</Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isLoading || !password}
                                className="rounded-3xl h-10 font-bold text-xs shadow-sm active:scale-95 transition-all"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : 'Confirm Deletion'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
});