import React from "react";

export default function Stepper({ currentStep }: { currentStep: number }) {
  const steps = ["Character", "Preferences"];
  return (
    <div className="flex justify-between mb-6">
      {steps.map((label, i) => (
        <div
          key={i}
          className={`flex-1 text-center py-2 rounded ${
            currentStep === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
