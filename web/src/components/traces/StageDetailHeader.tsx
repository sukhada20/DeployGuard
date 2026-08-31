import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TraceStageItem } from "@/lib/trace-stages";

interface StageDetailHeaderProps {
  activeStep: TraceStageItem;
  activeStepIndex: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
}

export function StageDetailHeader({
  activeStep,
  activeStepIndex,
  totalSteps,
  onPrev,
  onNext,
}: StageDetailHeaderProps) {
  const Icon = activeStep.icon;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6 text-foreground shrink-0" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-muted-foreground">
              STAGE {activeStep.num || activeStep.step}:
            </span>
            <h3 className="font-mono font-bold text-base sm:text-lg uppercase text-foreground">
              {activeStep.title}
            </h3>
            <Badge variant={activeStep.badgeVariant} className="text-xs font-mono font-bold">
              {activeStep.badge}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Actor: <strong className="text-foreground">{activeStep.actor}</strong>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={activeStepIndex === 0}
          onClick={onPrev}
          className="h-8 text-xs font-mono font-bold gap-1 border-border hover:border-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </Button>
        <Button
          variant="brutalistPrimary"
          size="sm"
          disabled={activeStepIndex === totalSteps - 1}
          onClick={onNext}
          className="h-8 text-xs font-mono font-bold gap-1"
        >
          <span>Next Stage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
