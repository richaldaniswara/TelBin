import React, { useState } from 'react';
import { Recycle, Camera, Award, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <Recycle className="w-24 h-24 text-[#34A853]" />,
      title: 'Welcome to TelBin',
      description: 'Your smart trash classification assistant that helps you sort waste correctly and protect our environment.',
      mascot: true
    },
    {
      icon: <Camera className="w-24 h-24 text-[#34A853]" />,
      title: 'Scan & Classify',
      description: 'Simply take a photo of any waste item. Our AI will identify whether it\'s plastic, paper, glass, metal, or biodegradable waste.',
      categories: ['Plastic', 'Paper', 'Glass', 'Metal', 'Organic', 'Cardboard']
    },
    {
      icon: <Award className="w-24 h-24 text-[#34A853]" />,
      title: 'Earn Rewards',
      description: 'Get points for every correct classification and unlock amazing eco-friendly rewards!',
      rewards: true
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <div className="flex items-center justify-center mb-8">
          {step.icon}
        </div>

        {step.mascot && (
          <div className="mb-6 text-6xl">♻️</div>
        )}

        <h1 className="text-center text-[#34A853] mb-4">{step.title}</h1>
        <p className="text-center text-gray-600 mb-8 max-w-sm">
          {step.description}
        </p>

        {step.categories && (
          <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm w-full">
            {step.categories.map((category) => (
              <div
                key={category}
                className="bg-green-50 rounded-2xl p-4 text-center border-2 border-green-100"
              >
                <div className="text-green-600">{category}</div>
              </div>
            ))}
          </div>
        )}

        {step.rewards && (
          <div className="flex gap-4 mb-8">
            <div className="text-4xl">🌱</div>
            <div className="text-4xl">🎁</div>
            <div className="text-4xl">🏆</div>
          </div>
        )}
      </div>

      <div className="px-8 pb-8">
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-[#34A853]'
                  : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-[#34A853] text-white rounded-full py-4 flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
        >
          {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight className="w-5 h-5" />
        </button>

        {currentStep > 0 && (
          <button
            onClick={onComplete}
            className="w-full text-gray-500 py-3 mt-2"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
