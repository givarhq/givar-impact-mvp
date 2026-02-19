'use client';

import React, { memo } from 'react';
import { Target, Edit2 } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { SmartCurrency } from '../../ui/smart-currency';
import { GivingGoal } from '../../../types';
import { motion } from 'framer-motion';

interface GoalProgressCardProps {
  goal: GivingGoal | null;
  onEditGoal: () => void;
}

export const GoalProgressCard = memo(function GoalProgressCard({ goal, onEditGoal }: GoalProgressCardProps) {
  const percent = goal?.percentComplete || 0;
  const strokeDashoffset = 283 - (283 * percent) / 100;

  return (
    <Card className="rounded-3xl border-border/40 bg-card shadow-sm h-full flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xs text-muted-foreground tracking-widest">
            {goal ? `${goal.interval.charAt(0) + goal.interval.slice(1).toLowerCase()} Goal` : 'Impact Goal'}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-3xl hover:bg-muted transition-colors active:scale-90"
            onClick={onEditGoal}
          >
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>

        {goal ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
            <div className="relative h-28 w-28 md:h-32 md:w-32">
              <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 100 100">
                <circle
                  className="text-muted/30"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
                <motion.circle
                  className="text-primary"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground tabular-nums">
                {percent}%
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 space-y-0.5"
            >
              <div className="text-sm font-bold text-foreground">
                <SmartCurrency amount={goal.currentAmount} currency={goal.currency} visible={true} size="small" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Of <SmartCurrency amount={goal.targetAmount} currency={goal.currency} visible={true} size="small" /> Target
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
            <div className="h-12 w-12 rounded-3xl bg-muted/50 flex items-center justify-center border border-border/50 mb-3 shadow-inner">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold text-foreground">Track Your Impact</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[1600px] leading-relaxed">
              Set a regular giving goal to stay consistent and track your community support over time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});