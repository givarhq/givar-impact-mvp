'use client';

import { useState, useEffect, memo } from 'react';
import { Trash2, PlusCircle, Landmark, ShieldCheck, Loader2, Users, Mail, Phone, UserPlus, ReceiptText } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import { useProposalStore, BudgetItem, VendorItem } from '../../../stores/proposal-store';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';

interface BudgetEditorProps {
  budgetItems?: BudgetItem[];
  onBudgetChange?: (items: BudgetItem[]) => void;
  vendorsList?: VendorItem[];
  onVendorsChange?: (items: VendorItem[]) => void;
  readOnly?: boolean;
  isLive?: boolean;
  isAdjustmentMode?: boolean;
  isAdmin?: boolean;
  proposalId?: string;
}

const FUNDING_STAGES = ['Early Stage', 'Main Stage', 'Final Stage'];

export const BudgetEditor = memo(function BudgetEditor({
  budgetItems,
  onBudgetChange,
  vendorsList,
  onVendorsChange,
  readOnly = false,
  isLive = false,
  isAdjustmentMode = false,
  isAdmin = false,
  proposalId
}: BudgetEditorProps) {

  const storeBudget = useProposalStore(state => state.budgetBreakdown);
  const storeVendors = useProposalStore(state => state.vendors);
  const targetAmount = useProposalStore(state => state.targetAmount);
  const updateField = useProposalStore(state => state.updateField);

  const budgetBreakdown = budgetItems || storeBudget;
  const vendors = vendorsList || storeVendors;

  const updateBudget = onBudgetChange ? (val: BudgetItem[]) => onBudgetChange(val) : (val: BudgetItem[]) => updateField('budgetBreakdown', val);
  const updateVendors = onVendorsChange ? (val: VendorItem[]) => onVendorsChange(val) : (val: VendorItem[]) => updateField('vendors', val);

  const isLocked = readOnly || (isLive && !isAdjustmentMode);

  const [subaccountModal, setSubaccountModal] = useState<{ isOpen: boolean; vendorId: string | null }>({ isOpen: false, vendorId: null });
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isCreatingSubaccount, setIsCreatingSubaccount] = useState(false);

  useEffect(() => {
    if (isAdmin && banks.length === 0) {
      setIsBankLoading(true);
      ApiService.admin.getPaystackBanks()
        .then(res => setBanks(res || []))
        .catch(() => toast.error("Failed to load banking network"))
        .finally(() => setIsBankLoading(false));
    }
  }, [isAdmin, banks.length]);

  // Recipient Auto-Assignment Logic
  useEffect(() => {
    if (!isLocked && vendors.length === 1) {
      const singleVendorId = vendors[0].id;
      const needsUpdate = budgetBreakdown.some(item => item.vendorId !== singleVendorId);
      if (needsUpdate) {
        const updatedBudget = budgetBreakdown.map(item => ({ ...item, vendorId: singleVendorId }));
        updateBudget(updatedBudget);
      }
    }
  }, [vendors, budgetBreakdown, isLocked, updateBudget]);

  const addVendor = () => {
    if (isLocked) return;
    const newVendor: VendorItem = { id: crypto.randomUUID(), name: '', email: '', phone: '' };
    updateVendors([...vendors, newVendor]);
  };

  const removeVendor = (id: string) => {
    if (isLocked) return;
    if (budgetBreakdown.some(b => b.vendorId === id)) {
      toast.error("Cannot remove recipient while they are assigned to an active item.");
      return;
    }
    updateVendors(vendors.filter(v => v.id !== id));
  };

  const updateVendorField = (id: string, field: keyof VendorItem, value: string) => {
    if (isLocked) return;
    updateVendors(vendors.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleUpdate = (id: string, field: keyof BudgetItem, value: string | number) => {
    if (isLocked) return;

    let processedValue: string | number = value;

    if (field === 'amount') {
      const raw = parseFormattedNumber(String(value));
      processedValue = raw === '' ? 0 : Number(raw);
      if (isNaN(processedValue)) processedValue = 0;
    }

    const updatedBudget = budgetBreakdown.map(item =>
      item.id === id ? { ...item, [field]: processedValue } : item
    );
    updateBudget(updatedBudget);
  };

  const addItem = () => {
    if (isLocked) return;
    const newItem: BudgetItem = {
      id: crypto.randomUUID(),
      vendorId: vendors.length === 1 ? vendors[0].id : '',
      costType: 'STANDARD', // Legacy fallback for DB integrity
      amount: 0,
      description: '',
      stage: '' // Force user to intentionally select the stage
    };
    updateBudget([...budgetBreakdown, newItem]);
  };

  const removeItem = (id: string) => {
    if (isLocked) return;
    updateBudget(budgetBreakdown.filter(item => item.id !== id));
  };

  const handleOpenSubaccountModal = (vendor: VendorItem) => {
    setBusinessName(vendor.name || '');
    setBankCode('');
    setAccountNumber('');
    setSubaccountModal({ isOpen: true, vendorId: vendor.id });
  };

  const handleCreateSubaccount = async () => {
    if (!bankCode || !accountNumber || !businessName) {
      return toast.error('All fields are required');
    }

    setIsCreatingSubaccount(true);
    const toastId = toast.loading('Verifying vendor account & generating secure routing code...');

    try {
      const targetVendor = vendors.find(v => v.id === subaccountModal.vendorId);
      const res = await ApiService.admin.createPaystackSubaccount({
        businessName,
        bankCode,
        accountNumber,
        vendorEmail: targetVendor?.email || undefined
      });

      const updatedVendors = vendors.map(v =>
        v.id === subaccountModal.vendorId ? { ...v, subaccountCode: res.subaccount_code } : v
      );
      updateVendors(updatedVendors);

      toast.success(`Gateway established: ${res.subaccount_code}`, { id: toastId });
      setSubaccountModal({ isOpen: false, vendorId: null });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Vendor bank verification failed', { id: toastId });
    } finally {
      setIsCreatingSubaccount(false);
    }
  };

  const handleRemoveSubaccount = (id: string) => {
    const updatedVendors = vendors.map(v =>
      v.id === id ? { ...v, subaccountCode: undefined } : v
    );
    updateVendors(updatedVendors);
  };

  useEffect(() => {
    if (!onBudgetChange) {
      const total = budgetBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
      if (total !== targetAmount) {
        updateField('targetAmount', total);
      }
    }
  }, [budgetBreakdown, onBudgetChange, targetAmount, updateField]);

  const totalCost = budgetBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);

  const fieldContainerClass = cn(
    "py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start",
    isLocked && "opacity-90"
  );

  const inputStyle = cn(
    "h-11 text-sm font-medium rounded-3xl transition-all duration-200 w-full",
    isLocked
      ? "bg-transparent border-transparent shadow-none font-bold text-foreground cursor-default focus-visible:ring-0 px-1"
      : "bg-muted/20 border-border/50 focus:bg-background focus:border-primary/50 px-4"
  );

  return (
    <div className="space-y-10">
      {/* SECTION A: VENDORS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Recipients
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Start by adding the institutions or service providers involved in your cause, then assign them to the relevant items below.
            </p>
          </div>
          {!isLocked && (
            <Button variant="outline" size="sm" onClick={addVendor} className="h-8 rounded-3xl text-xs font-bold gap-1.5 border-border/60 shadow-sm active:scale-95 transition-transform shrink-0 ml-2">
              <UserPlus className="h-3.5 w-3.5" /> Add
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-muted-foreground italic font-medium">
              No recipients registered yet.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {vendors.map(vendor => (
                <motion.div
                  key={vendor.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-3xl bg-muted/10 border border-border/40 shadow-sm space-y-3 relative group"
                >
                  {!isLocked && (
                    <button
                      onClick={() => removeVendor(vendor.id)}
                      className="absolute top-3 right-3 h-7 w-7 rounded-full bg-background border border-border/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90 shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground ml-1">Recipient Name *</label>
                    <Input
                      value={vendor.name}
                      onChange={(e) => updateVendorField(vendor.id, 'name', e.target.value)}
                      readOnly={isLocked}
                      className={cn(inputStyle, isLocked && "text-base px-1")}
                      placeholder="e.g. Continental Medical Supplies"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email</label>
                      <Input
                        value={vendor.email}
                        onChange={(e) => updateVendorField(vendor.id, 'email', e.target.value)}
                        readOnly={isLocked}
                        className={inputStyle}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-1.5"><Phone className="h-3 w-3" /> Phone</label>
                      <Input
                        value={vendor.phone}
                        onChange={(e) => updateVendorField(vendor.id, 'phone', e.target.value)}
                        readOnly={isLocked}
                        className={inputStyle}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-4 pt-4 border-t border-border/40 animate-in fade-in duration-300">
                      {vendor.subaccountCode ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl transition-colors">
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Automated Routing</span>
                              <span className="text-xs font-mono font-bold text-emerald-700 truncate mt-0.5">{vendor.subaccountCode}</span>
                            </div>
                          </div>
                          {!isLocked && (
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveSubaccount(vendor.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 rounded-xl text-[10px] font-bold px-3 active:scale-95 shrink-0">
                              Unbind
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl transition-colors">
                          <div className="flex items-start sm:items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                              <Landmark className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest leading-none">Direct Vendor Routing</span>
                              <span className="text-[10px] font-medium text-blue-700 mt-0.5 leading-snug">Bind bank account.</span>
                            </div>
                          </div>
                          {!isLocked && (
                            <Button variant="outline" size="sm" onClick={() => handleOpenSubaccountModal(vendor)} className="h-8 rounded-xl text-[10px] font-bold border-blue-200 text-blue-700 hover:bg-blue-100 active:scale-95 shrink-0 bg-white shadow-sm">
                              Bind Account
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* SECTION B: BUDGET ITEMS */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
          <ReceiptText className="h-4 w-4 text-primary" />
          Cost Breakdown
        </h3>

        <div className="space-y-2 mb-6">
          <p className="text-xs text-muted-foreground font-medium mb-2">
            List the main items needed to complete this cause and group them into their execution stages.
          </p>
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false} mode="popLayout">
            {budgetBreakdown.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2 }}
                className={fieldContainerClass}
              >
                {/* Column 1: Item */}
                <div className="md:col-span-4 space-y-1.5 min-w-0">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Item</label>
                  <Input
                    placeholder="Details..."
                    value={item.description}
                    onChange={(e) => handleUpdate(item.id, 'description', e.target.value)}
                    readOnly={isLocked}
                    className={inputStyle}
                  />
                </div>

                {/* Column 2: Recipient */}
                <div className="md:col-span-3 space-y-1.5 min-w-0">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Recipient</label>
                  {isLocked ? (
                    <Input value={vendors.find(v => v.id === item.vendorId)?.name || 'To be confirmed'} readOnly className={cn(inputStyle, "font-bold text-primary px-1")} />
                  ) : (
                    <Select value={item.vendorId || "unassigned"} onValueChange={(v) => handleUpdate(item.id, 'vendorId', v === 'unassigned' ? '' : v)} disabled={isLocked || vendors.length === 1}>
                      <SelectTrigger className={cn(inputStyle, (isLocked || vendors.length === 1) && "opacity-70 cursor-not-allowed")}>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-3xl shadow-xl border-border/40">
                        <SelectItem value="unassigned" className="rounded-2xl text-sm py-2.5 italic text-muted-foreground font-medium">To be confirmed</SelectItem>
                        {vendors.map((v) => (
                          <SelectItem key={v.id} value={v.id} className="rounded-2xl text-sm py-2.5 font-medium">
                            {v.name || 'Unnamed Recipient'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Column 3: Amount */}
                <div className="md:col-span-2 space-y-1.5 min-w-0">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Amount</label>
                  <div className="relative">
                    {!isLocked && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₦</span>}
                    <Input
                      placeholder="0"
                      className={cn(inputStyle, !isLocked && "pl-7", "tabular-nums font-bold text-base")}
                      value={item.amount === 0 && !isLocked ? '' : (isLocked ? `₦${formatNumberInput(String(item.amount))}` : formatNumberInput(String(item.amount)))}
                      onChange={(e) => handleUpdate(item.id, 'amount', e.target.value)}
                      readOnly={isLocked}
                    />
                  </div>
                </div>

                {/* Column 4: Funding Stage & Trash */}
                <div className="md:col-span-2 flex gap-2 items-end min-w-0">
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <label className="text-xs font-bold text-muted-foreground ml-1">Funding Stage</label>
                    {isLocked ? (
                      <Input value={item.stage || 'Not selected'} readOnly className={cn(inputStyle, "font-bold text-foreground px-1")} />
                    ) : (
                      <Select value={item.stage || undefined} onValueChange={(v) => handleUpdate(item.id, 'stage', v)} disabled={isLocked}>
                        <SelectTrigger className={inputStyle}>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-xl border-border/40">
                          {FUNDING_STAGES.map((stage) => (
                            <SelectItem key={stage} value={stage} className="rounded-2xl text-sm py-2.5 font-medium">
                              {stage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {!isLocked && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:bg-destructive/10 rounded-3xl h-11 w-11 shrink-0 transition-colors active:scale-90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {!isLocked && (
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full border-dashed border-2 rounded-3xl h-14 text-sm font-bold gap-2 text-muted-foreground hover:text-primary transition-all active:scale-[0.98] bg-muted/5 hover:bg-primary/5 hover:border-primary/30"
        >
          <PlusCircle className="h-4 w-4" /> Add expense entry
        </Button>
      )}

      <div className={cn(
        "flex justify-between items-center px-6 py-5 rounded-3xl border transition-all mt-4",
        isLocked ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-border/40 shadow-sm"
      )}>
        <span className="text-sm font-bold text-primary uppercase tracking-widest">Budget total</span>
        <span className="text-2xl font-black text-foreground tabular-nums tracking-tight">₦ {formatNumberInput(String(totalCost))}</span>
      </div>

      <Dialog open={subaccountModal.isOpen} onOpenChange={(isOpen) => !isOpen && !isCreatingSubaccount && setSubaccountModal({ isOpen: false, vendorId: null })}>
        <DialogContent className="rounded-3xl border-none shadow-2xl bg-card p-6 md:p-8 max-w-md">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-foreground">
              <Landmark className="h-5 w-5 text-primary" /> Bind Vendor Account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Destination Bank</label>
              <Select value={bankCode} onValueChange={setBankCode} disabled={isCreatingSubaccount || isBankLoading}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background">
                  <SelectValue placeholder={isBankLoading ? "Loading banks..." : "Select destination bank..."} />
                </SelectTrigger>
                <SelectContent className="rounded-3xl shadow-xl max-h-64">
                  {banks.map(bank => (
                    <SelectItem key={bank.code} value={bank.code} className="text-xs py-2.5 font-bold">
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">NUBAN Account Number</label>
              <Input
                placeholder="10-digit account number"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                disabled={isCreatingSubaccount}
                className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Registered Business Name</label>
              <Input
                placeholder="Official name matching bank records"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={isCreatingSubaccount}
                className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background font-bold"
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={handleCreateSubaccount}
                disabled={isCreatingSubaccount || !bankCode || accountNumber.length !== 10 || !businessName}
                className="w-full h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 border-0 bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                {isCreatingSubaccount ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Generate Route"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});