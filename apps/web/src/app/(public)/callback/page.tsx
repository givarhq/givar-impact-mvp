import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { PublicLayout } from '../../../components/layout/public-layout';
import { CallbackClient } from './callback-client';

export default function GlobalCallbackPage() {
  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-6 relative min-w-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <Card className="w-full max-w-[440px] border-border/40 shadow-2xl rounded-3xl overflow-hidden bg-card/50 backdrop-blur-2xl relative z-10 min-w-0">
          <Suspense fallback={<div className="p-20 flex justify-center min-w-0"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>}>
            <CallbackClient />
          </Suspense>
        </Card>
      </div>
    </PublicLayout>
  );
}