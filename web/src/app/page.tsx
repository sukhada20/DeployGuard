"use client";

import React from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { LogoWall } from "@/components/landing/LogoWall";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { FleetShowcase } from "@/components/landing/FleetShowcase";
import { GovernanceTraceWalkthrough } from "@/components/landing/GovernanceTraceWalkthrough";
import { PostmortemShowcase } from "@/components/landing/PostmortemShowcase";
import { SlaStatsSection } from "@/components/landing/SlaStatsSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-transparent text-foreground selection:bg-foreground selection:text-background">
      {/* 1. Top Navigation */}
      <LandingHeader />

      {/* 2. Main Content */}
      <main className="flex-1">
        {/* Section 1: Hero with live interactive simulation */}
        <HeroSection />

        {/* Section 2: Logo Wall */}
        <LogoWall />

        {/* Section 3: Feature Bento Architecture */}
        <FeatureBento />

        {/* Section 4: 5 Autonomous Fleet Agents */}
        <FleetShowcase />

        {/* Section 5: Governance Trace Walkthrough */}
        <GovernanceTraceWalkthrough />

        {/* Section 6: SRE Postmortem Showcase */}
        <PostmortemShowcase />

        {/* Section 7: SLA Statistics */}
        <SlaStatsSection />
      </main>

      {/* 3. Footer */}
      <LandingFooter />
    </div>
  );
}
