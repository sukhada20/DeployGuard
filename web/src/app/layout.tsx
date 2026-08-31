"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { AgenticBackground } from "@/components/ui/AgenticBackground";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2000,
            retry: 1,
          },
        },
      })
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>DeployGuard: Autonomous Governed Safe-Deployment Fleet</title>
        <meta name="description" content="Autonomous governed safe-deployment fleet for Cloud Run and GKE" />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased relative">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryClientProvider client={queryClient}>
            <AgenticBackground />
            <div className="relative z-10">
              {children}
            </div>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
