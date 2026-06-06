import { Header } from "@/components/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-8">{children}</main>
    </>
  );
}
