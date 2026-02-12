/**
 * DWx Traffic Manager - Process Guide Dialog
 * Main orchestrator dialog for the interactive step-by-step walkthrough system.
 * Shows a guide selector view when no guide is selected, or a wizard view
 * with sidebar navigation, step content, and footer controls.
 * v2.18.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogSurface,
  makeStyles,
} from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';
import type { ProcessGuide, GuideProgress } from '../../types/ProcessGuide';
import {
  GUIDE_CATEGORIES,
  loadGuideProgress,
  saveGuideProgress,
} from '../../types/ProcessGuide';
import { GuideSelectorView } from './GuideSelectorView';
import { StepSidebar } from './StepSidebar';
import { StepContent } from './StepContent';
import { GuideFooter } from './GuideFooter';

// ============================================================================
// Props
// ============================================================================

interface ProcessGuideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'account_manager' | 'manager';
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  surface: {
    maxWidth: '1100px',
    width: '95vw',
    maxHeight: '90vh',
    overflow: 'hidden',
  },
  wizardContainer: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gridTemplateRows: '1fr auto',
    height: 'calc(90vh - 2px)',
  },
  sidebarArea: {
    gridRow: '1 / 3',
    gridColumn: '1',
    overflow: 'hidden',
  },
  contentArea: {
    gridRow: '1',
    gridColumn: '2',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  footerArea: {
    gridRow: '2',
    gridColumn: '2',
  },
});

// ============================================================================
// Helper: get category color for a guide
// ============================================================================

function getCategoryColor(category: string): string {
  const match = GUIDE_CATEGORIES.find((c) => c.id === category);
  return match?.color ?? '#0078D4';
}

// ============================================================================
// Component
// ============================================================================

export const ProcessGuideDialog: React.FC<ProcessGuideDialogProps> = ({
  isOpen,
  onClose,
  userRole,
}) => {
  const classes = useStyles();
  const navigate = useNavigate();

  // ---- State ----
  const [selectedGuide, setSelectedGuide] = useState<ProcessGuide | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState<Record<string, GuideProgress>>({});

  // ---- Load progress from localStorage on open ----
  useEffect(() => {
    if (isOpen) {
      setProgress(loadGuideProgress());
    }
  }, [isOpen]);

  // ---- Reset state when dialog closes ----
  useEffect(() => {
    if (!isOpen) {
      setSelectedGuide(null);
      setCurrentStep(0);
    }
  }, [isOpen]);

  // ---- Handlers ----

  const handleSelectGuide = useCallback(
    (guide: ProcessGuide) => {
      setSelectedGuide(guide);
      const savedStep = progress[guide.id]?.currentStep ?? 0;
      // Clamp to valid range in case guide steps changed
      setCurrentStep(Math.min(savedStep, guide.steps.length - 1));
    },
    [progress]
  );

  const handleStepChange = useCallback(
    (index: number) => {
      if (!selectedGuide) return;
      setCurrentStep(index);

      const now = new Date().toISOString();
      const updated: Record<string, GuideProgress> = {
        ...progress,
        [selectedGuide.id]: {
          guideId: selectedGuide.id,
          completed: progress[selectedGuide.id]?.completed ?? false,
          completedAt: progress[selectedGuide.id]?.completedAt,
          currentStep: index,
          lastViewedAt: now,
        },
      };
      setProgress(updated);
      saveGuideProgress(updated);
    },
    [selectedGuide, progress]
  );

  const handleNext = useCallback(() => {
    if (!selectedGuide) return;
    if (currentStep >= selectedGuide.steps.length - 1) return;
    handleStepChange(currentStep + 1);
  }, [selectedGuide, currentStep, handleStepChange]);

  const handlePrevious = useCallback(() => {
    if (currentStep <= 0) return;
    handleStepChange(currentStep - 1);
  }, [currentStep, handleStepChange]);

  const handleMarkComplete = useCallback(() => {
    if (!selectedGuide) return;
    const now = new Date().toISOString();
    const updated: Record<string, GuideProgress> = {
      ...progress,
      [selectedGuide.id]: {
        guideId: selectedGuide.id,
        completed: true,
        completedAt: now,
        currentStep: selectedGuide.steps.length - 1,
        lastViewedAt: now,
      },
    };
    setProgress(updated);
    saveGuideProgress(updated);
  }, [selectedGuide, progress]);

  const handleBackToSelector = useCallback(() => {
    setSelectedGuide(null);
    setCurrentStep(0);
  }, []);

  const handleActionButton = useCallback(
    (route: string) => {
      onClose();
      navigate(route);
    },
    [onClose, navigate]
  );

  // ---- Derived values ----
  const isLastStep = selectedGuide
    ? currentStep >= selectedGuide.steps.length - 1
    : false;
  const isCompleted = selectedGuide
    ? progress[selectedGuide.id]?.completed ?? false
    : false;
  const categoryColor = selectedGuide
    ? getCategoryColor(selectedGuide.category)
    : '#0078D4';

  // ---- Render ----

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(_, data) => {
        if (!data.open) onClose();
      }}
    >
      <DialogSurface
        className={classes.surface}
        style={{ padding: 0 }}
      >
        {selectedGuide ? (
          // ---- Wizard View ----
          <div className={classes.wizardContainer}>
            {/* Left sidebar - spans both rows */}
            <div className={classes.sidebarArea}>
              <StepSidebar
                guide={selectedGuide}
                currentStep={currentStep}
                guideProgress={progress[selectedGuide.id]}
                onStepClick={handleStepChange}
              />
            </div>

            {/* Right top - scrollable step content */}
            <div className={classes.contentArea}>
              <StepContent
                step={selectedGuide.steps[currentStep]}
                stepIndex={currentStep}
                totalSteps={selectedGuide.steps.length}
                categoryColor={categoryColor}
              />
            </div>

            {/* Right bottom - footer navigation */}
            <div className={classes.footerArea}>
              <GuideFooter
                currentStep={currentStep}
                totalSteps={selectedGuide.steps.length}
                isLastStep={isLastStep}
                isCompleted={isCompleted}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onMarkComplete={handleMarkComplete}
                onBack={handleBackToSelector}
                onActionButton={handleActionButton}
                actionButton={selectedGuide.steps[currentStep].actionButton}
              />
            </div>
          </div>
        ) : (
          // ---- Selector View ----
          <GuideSelectorView
            userRole={userRole}
            progress={progress}
            onSelectGuide={handleSelectGuide}
            onClose={onClose}
          />
        )}
      </DialogSurface>
    </Dialog>
  );
};
