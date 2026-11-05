"use client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Toaster position="bottom-right" richColors />
      {children}
    </ThemeProvider>
  );
}
