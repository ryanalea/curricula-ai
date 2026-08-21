import React from 'react';
import { STEPS, WORKFLOW_STEPS } from '../../constants/domainCategories';
import { IconCheck } from '../icons/Icons';

export function StepProgressBar({ currentStep, onStepClick }) {
  const currentIdx = WORKFLOW_STEPS.indexOf(currentStep);
  return (
    <div className="step-progress-bar">
      {STEPS.map((step, i) => {
        const isDone = currentIdx > i;
        const isActive = currentIdx === i;
        const canClick = isDone || i <= currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div 
              className={`step-node ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
              style={{ cursor: canClick ? 'pointer' : 'default' }}
              onClick={() => {
                if (canClick && onStepClick && step.key !== 'generating' && step.key !== 'generated') {
                  onStepClick(step.key);
                }
              }}
              title={canClick ? `Go to ${step.label}` : ''}
            >
              <div className="step-node-circle">
                {isDone ? <IconCheck /> : <span>{i + 1}</span>}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`step-connector ${isDone ? 'done' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
