
import React, { useState } from 'react';
import { Plan, PlanStep, CodeFile } from '../types';
import { generateImplementationPlan, applyModification } from '../services/geminiService';
import { Play, CheckCircle, Circle, Loader2, ListTodo, Plus } from 'lucide-react';

interface PlannerProps {
  activeFile: CodeFile | undefined;
  onUpdateCode: (newCode: string) => void;
}

export const Planner: React.FC<PlannerProps> = ({ activeFile, onUpdateCode }) => {
  const [goal, setGoal] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStepId, setProcessingStepId] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    if (!goal.trim() || !activeFile) return;
    
    setIsLoading(true);
    try {
      const steps = await generateImplementationPlan(goal, activeFile.content, activeFile.language);
      setPlan({
        id: Date.now().toString(),
        goal,
        steps
      });
    } catch (e) {
      console.error(e);
      // Optional: Add error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyStep = async (stepId: string) => {
    if (!plan || !activeFile) return;
    
    const stepIndex = plan.steps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;
    
    const step = plan.steps[stepIndex];
    setProcessingStepId(stepId);

    // Optimistic update to show generating state
    const updateStepStatus = (status: PlanStep['status']) => {
        const newSteps = [...plan.steps];
        newSteps[stepIndex] = { ...newSteps[stepIndex], status };
        setPlan({ ...plan, steps: newSteps });
    };

    updateStepStatus('generating');

    try {
      const newCode = await applyModification(activeFile.content, activeFile.language, step.description);
      onUpdateCode(newCode);
      updateStepStatus('completed');
    } catch (e) {
      console.error(e);
      updateStepStatus('pending'); // Revert on failure
    } finally {
      setProcessingStepId(null);
    }
  };

  const reset = () => {
    setPlan(null);
    setGoal('');
  };

  if (!activeFile) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-editor-fgSecondary p-6 text-center">
              <ListTodo className="w-12 h-12 mb-4 opacity-50" />
              <p>Open a file to create an implementation plan.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-editor-bg">
      {!plan ? (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-editor-fg mb-2">
             <ListTodo className="w-5 h-5 text-blue-400" />
             <h3 className="font-semibold">Create Implementation Plan</h3>
          </div>
          <p className="text-xs text-editor-fgSecondary">
            Describe what you want to achieve. Gemini will break it down into steps and help you apply them to your file.
          </p>
          <textarea 
            className="w-full bg-editor-active text-editor-fg border border-editor-border rounded p-3 text-sm focus:border-blue-500 focus:outline-none min-h-[100px]"
            placeholder="E.g., Add a login form with email validation and a submit button handler..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <button 
            disabled={!goal.trim() || isLoading}
            onClick={handleGeneratePlan}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate Plan
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-editor-border bg-editor-sidebar">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-editor-fg text-sm">Active Plan</h3>
                    <button onClick={reset} className="text-xs text-blue-400 hover:underline">New Plan</button>
                </div>
                <p className="text-xs text-editor-fgSecondary line-clamp-2 italic">"{plan.goal}"</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {plan.steps.map((step, index) => (
                    <div 
                        key={step.id} 
                        className={`p-3 rounded border transition-colors ${
                            step.status === 'completed' 
                            ? 'bg-green-900/10 border-green-900/30' 
                            : step.status === 'generating'
                                ? 'bg-blue-900/10 border-blue-500/50'
                                : 'bg-editor-active border-editor-border'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                {step.status === 'completed' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : step.status === 'generating' ? (
                                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-500" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm ${step.status === 'completed' ? 'text-gray-400 line-through' : 'text-editor-fg'}`}>
                                    {step.description}
                                </h4>
                                
                                {step.status !== 'completed' && step.status !== 'generating' && (
                                    <button 
                                        onClick={() => handleApplyStep(step.id)}
                                        disabled={!!processingStepId}
                                        className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-30"
                                    >
                                        <Play className="w-3 h-3" />
                                        Apply to Code
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="p-3 border-t border-editor-border text-center">
                 <p className="text-[10px] text-editor-fgSecondary">Review changes after applying each step.</p>
            </div>
        </div>
      )}
    </div>
  );
};
