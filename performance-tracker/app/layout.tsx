import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "ระบบจัดเก็บผลการปฏิบัติงาน", description: "Performance Tracker" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
