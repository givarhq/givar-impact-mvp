import { BudgetItem, MediaItem, TimelineItem } from "../stores/proposal-store";

export enum Currency {
  NGN = 'NGN',
  USD = 'USD',
  GBP = 'GBP',
}

export type TxType = 'DEBIT' | 'CREDIT';
export type TxStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED' | 'SUSPENSE';
export type TxCategory = 'FUNDING' | 'DONATION' | 'TRANSACTION_FEE' | 'VOLUNTARY_TIP' | 'DISBURSEMENT' | 'REFUND' | 'INTERNAL_TRANSFER' | 'WITHDRAWAL' | 'ADJUSTMENT';

export type VerificationStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'FUNDED' | 'COMPLETED' | 'SUSPENDED';

export interface Project {
  id: string;
  slug: string;
  title: string;
  userId: string;
  description: string;
  shortDesc?: string;
  personalMessage?: string | null;
  targetAmount: string;
  raisedAmount: string;
  currency: string;
  percentFunded: number;
  imageUrl?: string;
  videoUrl?: string | null;
  status: ProjectStatus;
  isActive: boolean;
  endDate?: string;
  gallery: MediaItem[];
  createdAt: string;
  updatedAt: string;
  location?: string;
  tags?: string[];
  budgetBreakdown: BudgetItem[];
  executionTimeline: TimelineItem[];
  riskAnalysis?: string;
  isVerifiedOrganizer: boolean;
  organizerName: string;
  organizerType?: 'INDIVIDUAL' | 'ORGANIZATION' | 'SYSTEM';
  categoryName?: string;
  subcategoryName?: string;
  donorCount?: number;
  subcategoryId?: string;

  // Alignment Fields
  beneficiaryName?: string | null;
  beneficiaryAge?: number | null;
  beneficiaryRelationship?: string | null;
  vendorName?: string | null;
  vendorContactPerson?: string | null;
  vendorEmail?: string | null;
  vendorPhone?: string | null;
  vendorAddress?: string | null;
  hasPreCollectedFunds?: boolean;
  preCollectedAmount?: string | null;
  preCollectedHeldAt?: string | null;
  preCollectedProofKey?: string | null;
  preCollectedVerified?: boolean;

  // Phased Funding Fields
  currentPhaseIndex?: number;
  waitlistEmails?: string[];
}

export interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  type: 'MILESTONE' | 'ANNOUNCEMENT' | 'IMPACT_REPORT' | 'VERIFICATION_UPDATE' | 'GOAL_ADJUSTMENT' | 'MILESTONE_UPDATE' | 'FUNDS_DISBURSED' | 'IMPACT_ACHIEVED';
  createdAt: string;
}

export interface Disbursement {
  id: string;
  projectId: string;
  milestoneId: string;
  amount: string; // Serialized BigInt
  currency: string;
  vendorName: string;
  reference: string;
  createdAt: string;
}

export interface MilestoneProof {
  id: string;
  projectId: string;
  milestoneId: string;
  description: string;
  imageKeys: string[];
  submittedAt: string;
}

export interface ProjectManagementView extends Project {
  disbursements: Disbursement[];
  milestoneProofs: MilestoneProof[];
}

export interface Transaction {
  id: string;
  amount: string;
  currency: string;
  type: TxType;
  status: TxStatus;
  category: TxCategory;
  reference: string;
  description: string;
  metadata?: {
    channel?: string;
    card_type?: string;
    bank?: string;[key: string]: any;
  };
  createdAt: string;
  isDonation: boolean;
  projectName?: string;
  project?: {
    title: string;
    slug: string;
    imageUrl?: string;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
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

export interface ProjectProposal {
  id: string;
  userId: string;
  title: string;
  shortDesc: string;
  description: string;
  personalMessage: string | null;
  location: string;
  targetAmount: string; // Serialized BigInt
  currency: 'NGN' | 'USD' | 'GBP';

  coverImage: string | null;
  gallery: { url: string; type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'; caption?: string }[];
  videoUrl: string | null;

  budgetBreakdown: {
    id?: string;
    payTo?: string;
    costType?: string;
    amount?: number;
    description?: string;
    vendorSubaccount?: string; // <-- ADDED to nested schema
    // Legacy support types
    item?: string;
    cost?: number;
    vendor?: string;
    type?: string;
  }[];

  executionTimeline: {
    phase: string;
    estimatedDate: string;
    deliverables: string
  }[];

  riskAnalysis: string | null;

  kycDocuments: string[];
  organizationName: string | null;
  contactPhone: string | null;
  beneficiaryContact: string | null;

  categoryId?: string;
  subcategoryId?: string;
  subcategoryName?: string;

  // Alignment Fields
  beneficiaryName?: string | null;
  beneficiaryAge?: number | null;
  beneficiaryRelationship?: string | null;
  vendorName?: string | null;
  vendorContactPerson?: string | null;
  vendorEmail?: string | null;
  vendorPhone?: string | null;
  vendorAddress?: string | null;
  hasPreCollectedFunds?: boolean;
  preCollectedAmount?: string | null;
  preCollectedHeldAt?: string | null;
  preCollectedProofKey?: string | null;
  awarenessStatus?: string | null;

  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  updatedAt: string;
  approvedAt: string | null;

  // Relations
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  category: {
    name: string;
  };
}

export interface ProjectWithDetails extends Project {
  category?: {
    name: string;
    icon: string
  };
  updates?: ProjectUpdate[];
  donorCount?: number;
  isVerifiedOrganizer: boolean;
  organizerName: string;
}

export interface OrganizationProfile {
  id: string;
  userId: string;
  legalName: string;
  registrationNumber?: string;
  documentKeys: string[];
  status: VerificationStatus;
  adminFeedback?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  kycType?: 'INDIVIDUAL' | 'ORGANIZATION';
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
  onShare: (project: Project) => void;
  isPublic?: boolean;
  hideKobo?: boolean;
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
  hideKobo?: boolean;
}