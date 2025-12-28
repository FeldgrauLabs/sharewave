'use client';

import { useState } from "react";
import CompoundChart from "./compound-chart";
import { ControlsPane } from "./controls-pane";
import CompoundTable from "./compound-table";

export type Frequency = 'weekly' | 'fortnightly' | 'monthly';
const DefaultFrequency: Frequency = 'monthly';
const DefaultStart = 10000;
const DefaultContribution = 500;
const DefaultReturnRate = 0.07;

export default function Page() {
  const [initialAmount, setInitialAmount] = useState(DefaultStart);
  const [contribution, setContribution] = useState(DefaultContribution);
  const [contributionFrequency, setContributionFrequency] = useState<Frequency>(DefaultFrequency);
  const [returnRate, setReturnRate] = useState(DefaultReturnRate);

  // Year (1-50)
  const years = Array.from({ length: 50 }, (_, i) => i + 1);

  // Calculate data points
  const dataPoints = years.map(year => {
    let total = initialAmount;
    let totalContributed = initialAmount;

    const periods = year * (contributionFrequency === 'weekly' ? 52 : contributionFrequency === 'fortnightly' ? 26 : 12);

    for (let period = 1; period <= periods; period++) {
      totalContributed += contribution;
      total += contribution;
      total *= (1 + returnRate / (contributionFrequency === 'weekly' ? 52 : contributionFrequency === 'fortnightly' ? 26 : 12));
    }

    return { year, total: +total.toFixed(2), totalContributed: +totalContributed.toFixed(2) };
  });

  return (
    <div className="h-screen py-8 w-full max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Forecast Calculator</h1>
      <div className="flex flex-col gap-4 py-4">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-4">
            <ControlsPane initialAmount={initialAmount} contribution={contribution} contributionFrequency={contributionFrequency} returnRate={returnRate} setInitialAmount={setInitialAmount} setContribution={setContribution} setContributionFrequency={setContributionFrequency} setReturnRate={setReturnRate} />
          </div>

          <div className="col-span-8">
            <CompoundChart data={dataPoints} />
          </div>
        </div>

        <CompoundTable data={dataPoints} />
      </div>
    </div>
  )
}