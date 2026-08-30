"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
    <html lang="en" className="dark">
      <head>
        <title>DeployGuard — Autonomous Safe-Deployment Fleet & SRE Dashboard</title>
        <meta name="description" content="Fortified enterprise fleet for autonomous governed safe deployments on GCP" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
