import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background">
      {/* SOTA Background Effect: Subtle Green Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern Overlay (CSS only) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 text-center space-y-2">
          <Link href="/" className="inline-block">
             {/* Simple Text Logo for now, but styled */}
            <span className="text-4xl font-extrabold tracking-tighter text-primary">
              Givar.
            </span>
          </Link>
          <p className="text-muted-foreground text-sm font-medium">
            The modern way to give with impact.
          </p>
        </div>
        
        {/* The Card */}
        <div className="bg-card text-card-foreground p-8 md:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border backdrop-blur-sm">
          {children}
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Givar Inc. Secure & Transparent.
        </div>
      </div>
    </div>
  );
}