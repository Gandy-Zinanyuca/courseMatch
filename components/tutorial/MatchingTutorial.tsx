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
    title: "Course Matching Tutorial",
    content:
      "You're viewing another student's timetable! This overlay shows their sessions so you can find compatible times to swap.",
  },
  {
    title: "Compare Schedules",
    content:
      "Look at the colored blocks. Your sessions are solid, their sessions are outlined. Find overlapping free times!",
    highlight: ".timetable-grid",
  },
  {
    title: "Find Swap Opportunities",
    content:
      "Green highlighted slots show where you can swap to match with this student. These are sessions of the same course and type.",
  },
  {
    title: "Drag to Swap",
    content:
      "Click and drag one of your session blocks to a highlighted green slot. The system checks for conflicts automatically.",
    highlight: ".session-block",
  },
  {
    title: "Complete the Match",
    content:
      "Release to swap! You'll both end up in sessions that work better for your schedules. Your compatibility score will improve.",
  },
  {
    title: "Keep Matching!",
    content:
      "Try this with other students on the Discover page. The more you match, the better your schedule gets!",
  },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function MatchingTutorial({ isOpen, onClose }: Props) {
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
            {isLast ? "Got it!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
