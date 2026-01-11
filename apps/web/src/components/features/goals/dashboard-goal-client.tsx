'use client';

import { useState } from 'react';
import { GivingGoal } from '../../../types';
import { GoalProgressCard } from './goal-progress-card';
import { GoalSetupModal } from './goal-setup-modal';

interface DashboardGoalClientProps {
  initialGoal: GivingGoal | null;
}

export function DashboardGoalClient({ initialGoal }: DashboardGoalClientProps) {
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
}