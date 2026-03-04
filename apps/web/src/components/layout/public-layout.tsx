import { LandingHeader } from './landing-header';
import Link from 'next/link';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <LandingHeader variant="auth" />

      <main className="flex-1 pt-20">
        {children}
      </main>

      <footer className="border-t border-border/40 py-8 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-row flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-10 text-sm font-bold text-muted-foreground">
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
            <span className="hidden md:block text-border">|</span>
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <span className="hidden md:block text-border">|</span>
            <Link href="#" className="hover:text-primary transition-colors">
              Terms
            </Link>
          </div>
          <div className="mt-6 text-center text-xs font-medium text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Givar Impact. Infrastructure for modern philanthropy.
          </div>
        </div>
      </footer>
    </div>
  );
}