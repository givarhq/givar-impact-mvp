import { ApiService } from '../../../services/api';
import { Card } from '../../../components/ui/card';
import { Users, LayoutGrid, DollarSign, Activity } from 'lucide-react';
import { SmartCurrency } from '../../../components/ui/smart-currency';

export default async function AdminDashboard() {
  // We need to add admin methods to ApiService first!
  // Assuming ApiService.admin.getStats() exists
  const stats = await ApiService.admin.getStats(); 

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.users} icon={Users} color="text-blue-400" />
        <StatCard title="Active Projects" value={stats.projects} icon={LayoutGrid} color="text-purple-400" />
        <StatCard title="Total Donations" value={stats.donations} icon={Activity} color="text-amber-400" />
        <Card className="p-6 bg-zinc-900 border-zinc-800">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-zinc-400">Total Volume</p>
                    <div className="text-2xl font-bold mt-2">
                        <SmartCurrency amount={stats.volume} currency="NGN" visible={true} size="default" />
                    </div>
                </div>
                <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className="p-6 bg-zinc-900 border-zinc-800">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-zinc-400">{title}</p>
                    <h3 className="text-2xl font-bold mt-2">{value}</h3>
                </div>
                <Icon className={`h-5 w-5 ${color}`} />
            </div>
        </Card>
    )
}