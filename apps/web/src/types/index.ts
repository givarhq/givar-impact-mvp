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