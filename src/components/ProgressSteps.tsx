import { CheckCircle2 } from "lucide-react";

type ProgressStepsProps = {
  steps: string[];
  completed: boolean[];
  labels: {
    completed: string;
    pending: string;
  };
};

export function ProgressSteps({ steps, completed, labels }: ProgressStepsProps) {
  return (
    <nav className="steps" aria-label="Request progress">
      {steps.map((step, index) => (
        <article className={`step-card ${completed[index] ? "done" : ""}`} key={step}>
          <span className="step-number">{completed[index] ? <CheckCircle2 size={20} aria-hidden="true" /> : index + 1}</span>
          <div>
            <strong>{step}</strong>
            <small>{completed[index] ? labels.completed : labels.pending}</small>
          </div>
        </article>
      ))}
    </nav>
  );
}
