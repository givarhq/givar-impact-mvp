export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function calculatePhaseFunding(project: {
  status: string;
  targetAmount: string | bigint | number;
  raisedAmount: string | bigint | number;
  currentPhaseIndex?: number;
  budgetBreakdown?: any[];
  executionTimeline?: any[];
}) {
  const raised = BigInt(project.raisedAmount || '0');
  const target = BigInt(project.targetAmount || '0');
  const isCompleted = project.status === 'COMPLETED';
  const isFundedState = project.status === 'FUNDED' || (raised >= target && target > 0n && !isCompleted);

  const totalRemaining = raised >= target ? 0n : target - raised;
  const totalPercent = target > 0n
    ? Math.min(100, Math.floor(Number(raised * 100n / target)))
    : 0;

  const activeIndex = project.currentPhaseIndex || 0;
  const budget = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];
  const timeline = Array.isArray(project.executionTimeline) ? project.executionTimeline : [];

  let previousPhasesMajor = 0;
  let currentPhaseMajor = 0;

  const previousStages = timeline.slice(0, activeIndex).map((t: any) => t.phase);
  const currentStageLogicName = timeline[activeIndex]?.phase || 'Main Stage';

  const stageBudgetItems = budget
    .filter((b: any) => (b.stage || 'Main Stage') === currentStageLogicName)
    .map((b: any) => b.description || b.item)
    .filter(Boolean)
    .join(', ');

  const cleanStageName = currentStageLogicName.replace(/^Phase \d+:\s*/i, '');
  const currentStageDisplayName = timeline[activeIndex]
    ? `${cleanStageName}${stageBudgetItems ? `: ${stageBudgetItems}` : ''}`
    : cleanStageName;

  budget.forEach((item: any) => {
    const amt = Number(item.amount || item.cost || 0);
    const itemStage = item.stage || 'Main Stage';

    if (previousStages.includes(itemStage)) {
      previousPhasesMajor += amt;
    } else if (itemStage === currentStageLogicName) {
      currentPhaseMajor += amt;
    }
  });

  const previousPhasesMinor = BigInt(Math.round(previousPhasesMajor * 100));
  let phaseCapMinor = BigInt(Math.round((previousPhasesMajor + currentPhaseMajor) * 100));

  if (timeline.length === 0 || activeIndex >= timeline.length) {
    phaseCapMinor = target;
  }

  const currentPhaseTargetMinor = phaseCapMinor - previousPhasesMinor;
  let raisedInCurrentPhase = raised - previousPhasesMinor;
  if (raisedInCurrentPhase < 0n) raisedInCurrentPhase = 0n;

  const remainingForPhaseMinor = currentPhaseTargetMinor > raisedInCurrentPhase
    ? currentPhaseTargetMinor - raisedInCurrentPhase
    : 0n;

  const isPhaseFull = remainingForPhaseMinor < 10000n && currentPhaseTargetMinor > 0n && !isFundedState && !isCompleted;

  const phasePercent = currentPhaseTargetMinor > 0n
    ? Math.min(100, Math.floor(Number(raisedInCurrentPhase * 100n / currentPhaseTargetMinor)))
    : (raisedInCurrentPhase > 0n ? 100 : 0);

  return {
    totalRaised: raised,
    totalTarget: target,
    totalRemaining,
    totalPercent,
    isCompleted,
    isFundedState,
    currentStageLogicName,
    cleanStageName,
    currentStageDisplayName,
    previousPhasesMinor,
    phaseCapMinor,
    currentPhaseTargetMinor,
    raisedInCurrentPhase,
    remainingForPhaseMinor,
    phasePercent,
    isPhaseFull,
    previousStages
  };
}