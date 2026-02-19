'use client';

import React, { useState, memo } from 'react';
import { GivingGoal } from '../../../types';
import { GoalProgressCard } from './goal-progress-card';
import { GoalSetupModal } from './goal-setup-modal';

export const DashboardGoalClient = memo(function DashboardGoalClient({ initialGoal }: { initialGoal: GivingGoal | null }) {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  return (
    <>
      <GoalProgressCard
        goal={initialGoal}
        onEditGoal={() => setIsGoalModalOpen(true)}
      />

      <GoalSetupModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        goal={initialGoal}
      />
    </>
  );
});