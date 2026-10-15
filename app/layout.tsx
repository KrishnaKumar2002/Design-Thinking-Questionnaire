import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design Research Studio",
  description: "Design-thinking interviews and evidence-based insights for wearable AI assistance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
