import { cookies } from 'next/headers';
import { ApiService } from '../../../services/api';
import { Card } from '../../../components/ui/card';
import { Users, LayoutGrid, DollarSign, Activity } from 'lucide-react';
import { SmartCurrency } from '../../../components/ui/smart-currency';
import { cn } from '../../../lib/utils/cn';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return <div>Unauthorized</div>;

  const stats = await ApiService.admin.getStats(token); 

  if (!stats) return <div>Failed to load stats</div>;

  return (
    <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:hidden">Platform Overview</h1>
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard title="Total Users" value={stats.users} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
        <AdminStatCard title="Active Projects" value={stats.projects} icon={LayoutGrid} color="text-purple-500" bg="bg-purple-500/10" />
        <AdminStatCard title="Total Donations" value={stats.donations} icon={Activity} color="text-amber-500" bg="bg-amber-500/10" />
        
        {/* Volume Card - Special Styling */}
        <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-emerald-500/50 via-transparent to-transparent">
            <Card className="relative h-full overflow-hidden bg-card border-none rounded-[15px] p-6 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
                <div className="relative flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                        <div className="text-2xl font-bold mt-2 text-foreground">
                            <SmartCurrency amount={stats.volume} currency="NGN" visible={true} size="default" />
                        </div>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <DollarSign className="h-5 w-5" />
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="p-6 bg-card border-border shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold mt-2 text-foreground">{value}</h3>
                </div>
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-colors", bg, color)}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </Card>
    )
}