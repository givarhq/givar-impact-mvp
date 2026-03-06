import { LandingHeader } from './landing-header';
import { Footer } from './footer';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <LandingHeader variant="auth" />

      <main className="flex-1 pt-20">
        {children}
      </main>

      <Footer />
    </div>
  );
}