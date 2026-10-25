import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#ECE8DF] text-[#171514] font-mono flex flex-col items-center justify-center p-6 text-center">
      <div className="font-mono text-xs font-bold text-[#DF491E] mb-2">[ 404 // NOT FOUND ]</div>
      <h1 className="font-display text-4xl sm:text-6xl font-black mb-4">ACCESS DENIED / DOSSIER MISSING</h1>
      <p className="max-w-md text-sm text-[#5A5650] mb-6">
        The requested record could not be retrieved from the intelligence archive.
      </p>
      <Link
        href="/"
        className="px-4 py-2 border-2 border-[#171514] bg-[#DF491E] text-[#171514] font-bold hover:bg-[#C73E16] transition-colors"
      >
        RETURN TO DOSSIER ↗
      </Link>
    </div>
  );
}
