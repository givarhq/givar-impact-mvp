import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 text-center">
        <Link href="/" className="text-3xl font-bold tracking-tight text-slate-900">
          Givar.
        </Link>
        <p className="text-slate-500 mt-2">Impact-driven giving for everyone.</p>
      </div>
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        {children}
      </div>
    </div>
  );
}