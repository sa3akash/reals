import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen flex-col gap-10">
      <Link href="/reals" className="text-4xl hover:underline">Reels</Link>
      <Link href="/upload" className="text-4xl hover:underline">Upload</Link>
    </div>
  );
}
