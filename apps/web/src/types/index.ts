export type TxType = 'DEBIT' | 'CREDIT';
export type TxStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  targetAmount: string; // BigInt serialized as string
  raisedAmount: string;
  currency: string;
  percentFunded: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  amount: string;
  currency: string;
  type: TxType;
  status: TxStatus;
  description: string;
  createdAt: string;
  isDonation: boolean;
  projectName?: string;
}

export interface Subscription {
  id: string;
  amount: string;
  currency: string;
  interval: 'WEEKLY' | 'MONTHLY';
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  nextChargeDate: string;
  project: {
    title: string;
    imageUrl?: string;
  };
}