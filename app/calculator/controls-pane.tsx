import { SideCard } from "@/components/side-card";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel, FieldDescription } from "@/components/ui/field";
import { ButtonGroup } from "@/components/ui/button-group";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Frequency } from "./page";

interface ControlsPaneProps {
  initialAmount: number;
  contribution: number;
  contributionFrequency: Frequency;
  returnRate: number;
  setInitialAmount: (value: number) => void;
  setContribution: (value: number) => void;
  setContributionFrequency: (value: Frequency) => void;
  setReturnRate: (value: number) => void;
}

export const ControlsPane = ({
  initialAmount,
  contribution,
  contributionFrequency,
  returnRate,
  setInitialAmount,
  setContribution,
  setContributionFrequency,
  setReturnRate,
}: ControlsPaneProps) => {
  // Rate 0 -> 30%
  // Initial Amount 0 -> no-limit
  // Contribution 0 -> no-limit

  const [localInitial, setLocalInitial] = useState<number>(initialAmount ?? 0);
  const [localContribution, setLocalContribution] = useState<number>(contribution ?? 0);
  const [localReturnPct, setLocalReturnPct] = useState<number>(returnRate * 100);

  const onInitialChange = (v: number) => {
    setLocalInitial(v);
    setInitialAmount(v);
  };

  const onContributionChange = (v: number) => {
    setLocalContribution(v);
    setContribution(v);
  };

  const onReturnPctChange = (v: number) => {
    setLocalReturnPct(v);
    setReturnRate(v / 100);
  };

  const mainContent = (
    <div className="space-y-8">
      <Field>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Initial Amount</FieldLabel>
          <span className="text-right">${localInitial.toLocaleString()}</span>
        </div>
        <FieldContent>
          <Slider
            defaultValue={[localInitial]}
            min={0}
            max={500_000}
            step={100}
            onValueChange={(v) => onInitialChange(v[0])}
            className="w-full"
          />
          <FieldDescription>Starting amount invested</FieldDescription>
        </FieldContent>
      </Field>

      <Field>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Contribution</FieldLabel>
          <span className="text-right">${localContribution.toLocaleString()}</span>
        </div>
        <FieldContent>
          <Slider
            defaultValue={[localContribution]}
            min={0}
            max={10_000}
            step={100}
            onValueChange={(v) => onContributionChange(v[0])}
            className="w-full"
          />
          <FieldDescription>Recurring contribution amount</FieldDescription>
        </FieldContent>
      </Field>

      <Field orientation="responsive">
        <FieldLabel>Contribution Frequency</FieldLabel>
        <FieldContent>
          <ButtonGroup>
            <Button type="button" variant={contributionFrequency === 'monthly' ? 'default' : 'outline'} onClick={() => setContributionFrequency('monthly')}>Monthly</Button>
            <Button type="button" variant={contributionFrequency === 'fortnightly' ? 'default' : 'outline'} onClick={() => setContributionFrequency('fortnightly')}>Fortnightly</Button>
            <Button type="button" variant={contributionFrequency === 'weekly' ? 'default' : 'outline'} onClick={() => setContributionFrequency('weekly')}>Weekly</Button>
          </ButtonGroup>
        </FieldContent>
      </Field>

      <Field>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Expected Return (%)</FieldLabel>
          <span className="text-right">{localReturnPct.toFixed(1)}%</span>
        </div>
        <FieldContent>
          <Slider
            defaultValue={[localReturnPct]}
            min={0}
            max={30}
            step={0.1}
            onValueChange={(v) => onReturnPctChange(v[0])}
            className="w-full"
          />
          <FieldDescription>Annual expected return</FieldDescription>
        </FieldContent>
      </Field>
    </div>
  )

  return (
    <div className="w-full">
      <SideCard
        title="Investment Controls"
        children={mainContent}
      />
    </div>
  )
}