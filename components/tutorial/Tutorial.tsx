"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/cx";

type Step = {
  title: string;
  content: string;
  highlight?: string; // CSS selector to highlight
};

const STEPS: Step[] = [
  {
    title: "Welcome to Course Swapping!",
    content:
      "This tutorial will guide you through swapping courses with other students. Let's get started!",
  },
  {
    title: "Your Timetable",
    content:
      "This is your current timetable. Each colored block represents a course session you have.",
    highlight: ".timetable-grid",
  },
  {
    title: "Finding Swaps",
    content:
      "On the Discover page, you'll see students with compatible schedules. Look for the 'Swap' option.",
  },
  {
    title: "Dragging Sessions",
    content:
      "To swap, click and hold on a session block in your timetable, then drag it to a new time slot.",
    highlight: ".session-block",
  },
  {
    title: "Dropping Sessions",
    content:
      "Release the mouse when you see a valid drop zone highlighted. The system will check for conflicts.",
  },
  {
    title: "Confirming Swaps",
    content:
      "If there's a conflict, you'll be notified. Otherwise, your swap is complete and your timetable updates!",
  },
  {
    title: "That's it!",
    content: "You're ready to start swapping courses. Happy matching!",
  },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function Tutorial({ isOpen, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-anu-navy">{step.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-700 mb-6">{step.content}</p>
        <div className="flex justify-between">
          <button
            onClick={prev}
            disabled={currentStep === 0}
            className={cx(
              "px-4 py-2 rounded",
              currentStep === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-anu-navy text-white hover:bg-anu-navy/90",
            )}
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 self-center">
            {currentStep + 1} of {STEPS.length}
          </span>
          <button
            onClick={next}
            className="px-4 py-2 bg-anu-navy text-white rounded hover:bg-anu-navy/90"
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
