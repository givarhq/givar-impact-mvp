import { redirect } from 'next/navigation';

export default function FundWalletPage() {
  // COMPLIANCE LOCK: Wallet funding is disabled to comply with non-custodial regulations.
  // Instantly redirect any user who attempts to navigate to this route back to the dashboard.
  redirect('/dashboard');
}