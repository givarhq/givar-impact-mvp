'use client';

import { useState, useEffect, memo } from 'react';
import { Trash2, PlusCircle, Landmark, ShieldCheck, Loader2, Info } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import { useProposalStore, BudgetItem } from '../../../stores/proposal-store';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_COST_TYPES, DEFAULT_COST_TYPES } from '../../../lib/utils/category-constants';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';

interface BudgetEditorProps {
  budgetItems?: BudgetItem[];
  onBudgetChange?: (items: BudgetItem[]) => void;
  readOnly?: boolean;
  isLive?: boolean;
  isAdjustmentMode?: boolean;
  categorySlug?: string;
  isAdmin?: boolean;
}

export const BudgetEditor = memo(function BudgetEditor({
  budgetItems,
  onBudgetChange,
  readOnly = false,
  isLive = false,
  isAdjustmentMode = false,
  categorySlug,
  isAdmin = false
}: BudgetEditorProps) {

  const storeBudget = useProposalStore(state => state.budgetBreakdown);
  const targetAmount = useProposalStore(state => state.targetAmount);
  const updateField = useProposalStore(state => state.updateField);

  const budgetBreakdown = budgetItems || storeBudget;
  const updateBudget = onBudgetChange ? (val: BudgetItem[]) => onBudgetChange(val) : (val: BudgetItem[]) => updateField('budgetBreakdown', val);

  const isLocked = readOnly || (isLive && !isAdjustmentMode);

  const activeCostTypes = categorySlug && CATEGORY_COST_TYPES[categorySlug]
    ? CATEGORY_COST_TYPES[categorySlug]
    : DEFAULT_COST_TYPES;

  // --- SUBACCOUNT CREATION STATE ---
  const [subaccountModal, setSubaccountModal] = useState<{ isOpen: boolean; itemId: string | null }>({ isOpen: false, itemId: null });
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
      payTo: '',
      vendorContact: '',
      costType: activeCostTypes[0].value,
      amount: 0,
      description: '',
    };
    updateBudget([...budgetBreakdown, newItem]);
  };

  const removeItem = (id: string) => {
    if (isLocked) return;
    updateBudget(budgetBreakdown.filter(item => item.id !== id));
  };

  const handleOpenSubaccountModal = (item: BudgetItem) => {
    setBusinessName(item.payTo || '');
    setBankCode('');
    setAccountNumber('');
    setSubaccountModal({ isOpen: true, itemId: item.id });
  };

  const handleCreateSubaccount = async () => {
    if (!bankCode || !accountNumber || !businessName) {
      return toast.error('All fields are required');
    }

    setIsCreatingSubaccount(true);
    const toastId = toast.loading('Verifying vendor account & generating secure routing code...');

    try {
      const res = await ApiService.admin.createPaystackSubaccount({
        businessName,
        bankCode,
        accountNumber
      });

      const updatedBudget = budgetBreakdown.map(i =>
        i.id === subaccountModal.itemId ? { ...i, vendorSubaccount: res.subaccount_code } : i
      );
      updateBudget(updatedBudget);

      toast.success(`Gateway established: ${res.subaccount_code}`, { id: toastId });
      setSubaccountModal({ isOpen: false, itemId: null });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Vendor bank verification failed', { id: toastId });
    } finally {
      setIsCreatingSubaccount(false);
    }
  };

  const handleRemoveSubaccount = (id: string) => {
    const updatedBudget = budgetBreakdown.map(i =>
      i.id === id ? { ...i, vendorSubaccount: undefined } : i
    );
    updateBudget(updatedBudget);
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
    "py-4 border-b border-border/40 last:border-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-start",
    isLocked && "border-border/60"
  );

  const inputStyle = cn(
    "h-10 text-sm rounded-3xl transition-all duration-200 w-full",
    isLocked
      ? "bg-transparent border-transparent shadow-none font-bold text-foreground cursor-default focus-visible:ring-0 px-1"
      : "bg-muted/20 border-border/50 focus:bg-background focus:border-primary/50"
  );

  return (
    <div className="space-y-6">

      {!isLocked && !isAdmin && (
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3 shadow-sm animate-in fade-in">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 font-medium leading-relaxed">
            If you do not have a specific vendor in mind yet, you can leave the recipient and contact fields blank. A verified vendor can be sourced later before the cause is launched.
          </p>
        </div>
      )}

      <div className="space-y-1">
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
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-muted-foreground ml-1">Who will receive the funds?</label>
                <Input
                  placeholder="e.g. Peace Hospital (Optional)"
                  value={item.payTo}
                  onChange={(e) => handleUpdate(item.id, 'payTo', e.target.value)}
                  readOnly={isLocked}
                  className={inputStyle}
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-muted-foreground ml-1">Vendor contact</label>
                <Input
                  placeholder="Phone or email (Optional)"
                  value={item.vendorContact || ''}
                  onChange={(e) => handleUpdate(item.id, 'vendorContact', e.target.value)}
                  readOnly={isLocked}
                  className={inputStyle}
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-muted-foreground ml-1">Expense type</label>
                {isLocked ? (
                  <Input value={item.costType} readOnly className={inputStyle} />
                ) : (
                  <Select value={item.costType} onValueChange={(v) => handleUpdate(item.id, 'costType', v)} disabled={isLocked}>
                    <SelectTrigger className={cn(inputStyle, "font-bold", isLocked && "text-primary")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl shadow-xl border-border/40">
                      {activeCostTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="rounded-2xl text-xs py-2.5">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-muted-foreground ml-1">Amount</label>
                <div className="relative">
                  {!isLocked && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">₦</span>}
                  <Input
                    placeholder="0"
                    className={cn(inputStyle, !isLocked && "pl-7", "tabular-nums font-bold")}
                    value={item.amount === 0 && !isLocked ? '' : (isLocked ? `₦${formatNumberInput(String(item.amount))}` : formatNumberInput(String(item.amount)))}
                    onChange={(e) => handleUpdate(item.id, 'amount', e.target.value)}
                    readOnly={isLocked}
                  />
                </div>
              </div>

              <div className="md:col-span-12 flex gap-2 items-end">
                <div className="flex-1 space-y-1 min-w-0">
                  <label className="text-xs font-bold text-muted-foreground ml-1">Description</label>
                  <Input
                    placeholder="Details..."
                    value={item.description}
                    onChange={(e) => handleUpdate(item.id, 'description', e.target.value)}
                    readOnly={isLocked}
                    className={inputStyle}
                  />
                </div>
                {!isLocked && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:bg-destructive/10 rounded-2xl h-10 w-10 shrink-0 transition-colors active:scale-90 mb-[1px]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* ADMIN ONLY: PAYSTACK SUBACCOUNT ROUTING INTEGRATION */}
              {isAdmin && (
                <div className="md:col-span-12 mt-3 animate-in fade-in duration-300">
                  {item.vendorSubaccount ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-3xl transition-colors">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Automated Vendor Routing</span>
                          <span className="text-sm font-mono font-bold text-emerald-700 truncate mt-0.5">{item.vendorSubaccount}</span>
                        </div>
                      </div>
                      {!isLocked && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveSubaccount(item.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 rounded-2xl text-xs font-bold px-4 active:scale-95 shrink-0">
                          Remove Link
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-3xl transition-colors">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                          <Landmark className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest leading-none">Direct Vendor Routing</span>
                          <span className="text-xs font-medium text-blue-700 mt-0.5 leading-snug">Attach a bank account to skip the Givar Treasury and route funds directly to the vendor.</span>
                        </div>
                      </div>
                      {!isLocked && (
                        <Button variant="outline" size="sm" onClick={() => handleOpenSubaccountModal(item)} className="h-9 rounded-2xl text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-100 active:scale-95 shrink-0 bg-white">
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

      {/* ADMIN SUBACCOUNT CREATION DIALOG */}
      <Dialog open={subaccountModal.isOpen} onOpenChange={(isOpen) => !isOpen && !isCreatingSubaccount && setSubaccountModal({ isOpen: false, itemId: null })}>
        <DialogContent className="rounded-3xl border-none shadow-2xl bg-card p-6 md:p-8 max-w-md">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-foreground">
              <Landmark className="h-5 w-5 text-primary" /> Bind Vendor Account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground ml-1">Destination Bank</label>
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
              <label className="text-xs font-bold text-muted-foreground ml-1">NUBAN Account Number</label>
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
              <label className="text-xs font-bold text-muted-foreground ml-1">Registered Business Name</label>
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