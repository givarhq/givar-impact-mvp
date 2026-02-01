'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, DollarSign } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';

export function DisbursementForm({ projectId, timeline }: { projectId: string; timeline: any[] }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [milestoneId, setMilestoneId] = useState('');
    const [vendorName, setVendorName] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');

    const handleSubmit = async () => {
        if (!milestoneId || !vendorName || !amount || !reference) {
            return toast.error('All fields are required');
        }
        setIsLoading(true);
        try {
            await ApiService.admin.recordDisbursement(projectId, {
                milestoneId,
                vendorName,
                amount: parseFormattedNumber(amount) + '00', // Convert to minor units
                reference,
            });
            toast.success('Disbursement recorded and owner notified!');
            router.refresh(); // Refresh to show in history
        } catch (error) {
            toast.error('Failed to record disbursement.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6 bg-card rounded-2xl border border-border/50">
            <div className="space-y-3">
                <label className="text-sm font-medium">Target Milestone</label>
                <Select onValueChange={setMilestoneId}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select phase..." /></SelectTrigger>
                    <SelectContent>
                        {timeline.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.phase}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Vendor Name" value={vendorName} onChange={e => setVendorName(e.target.value)} />
                <Input label="Bank/Payment Reference" value={reference} onChange={e => setReference(e.target.value)} />
            </div>
            <Input
                label="Amount Disbursed (NGN)"
                value={formatNumberInput(amount)}
                onChange={e => setAmount(e.target.value)}
            />
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full h-12 rounded-xl">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Record & Notify Owner'}
            </Button>
        </div>
    );
}