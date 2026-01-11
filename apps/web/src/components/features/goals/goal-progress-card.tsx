'use client';

import { Target, Edit2 } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { SmartCurrency } from '../../ui/smart-currency';
import { GivingGoal } from '../../../types';

interface GoalProgressCardProps {
  goal: GivingGoal | null;
  onEditGoal: () => void;
}

export function GoalProgressCard({ goal, onEditGoal }: GoalProgressCardProps) {
  const percent = goal?.percentComplete || 0;
  const strokeDashoffset = 283 - (283 * percent) / 100;

  return (
    <Card className="rounded-2xl shadow-sm h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">
            {goal ? `${goal.interval.charAt(0) + goal.interval.slice(1).toLowerCase()} Giving Goal` : 'Set a Goal'}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onEditGoal}>
            <Edit2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {goal ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Circular Progress Bar (SVG) */}
            <div className="relative h-32 w-32">
              <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 100 100">
                <circle
                  className="text-secondary"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-primary"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-foreground">
                {percent}%
              </div>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">
                <SmartCurrency amount={goal.currentAmount} currency={goal.currency} visible={true} />
              </span>
              {' '}of your{' '}
              <SmartCurrency amount={goal.targetAmount} currency={goal.currency} visible={true} />
              {' '}goal
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
             <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-4 border-background mb-4">
                <Target className="h-8 w-8 text-muted-foreground" />
             </div>
             <p className="text-sm font-medium text-foreground">Track your impact</p>
             <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Set a monthly or yearly goal to stay motivated.
             </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}