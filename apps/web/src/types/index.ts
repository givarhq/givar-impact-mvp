export enum Currency {
  NGN = 'NGN',
  USD = 'USD',
  GBP = 'GBP',
}

export type TxType = 'DEBIT' | 'CREDIT';
export type TxStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  targetAmount: string;
  raisedAmount: string;
  currency: string;
  percentFunded: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string; 
  updatedAt: string;
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
  project: {
    title: string;
    slug: string;
  };
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
    slug: string;
    imageUrl?: string;
  };
}

export interface GivingGoal {
  id: string;
  targetAmount: string;
  currentAmount: string;
  currency: string;
  interval: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  percentComplete: number;
}

export interface Wallet {
  id: string;
  userId: string;
  currency: 'NGN' | 'USD' | 'GBP';
  balance: string;
}

export interface OverviewCardsProps {
  wallet: { balance: string; currency: string };
  totalImpact: string; 
  donationCount: number;
}

export interface HistoryClientProps {
  initialData: {
    data: Transaction[];
    meta: {
      total: number;
      page: number;
      lastPage: number;
    };
  };
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export interface ImpactFeedProps {
  projects: Project[];
}

export interface ProjectCardProps {
  project: Project;
  onDonate: (project: Project) => void;
}

export interface WalletCardProps {
  balance: string;
  currency: string;
}

export interface DashboardShellProps {
  children: React.ReactNode;
}

export interface LandingHeaderProps {
  hideAuthButtons?: boolean;
  variant?: 'default' | 'auth';
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export interface SmartCurrencyProps {
  amount: string;
  currency: string;
  visible: boolean;
  className?: string;
  size?: 'small' | 'default' | 'large';
}