import { useEffect, useRef, useState } from "react";

const CircularTimer = ({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const prevTimeLeft = useRef(timeLeft);
    const [shouldAnimate, setShouldAnimate] = useState(true);

    useEffect(() => {
      // If time has increased (reset), disable animation temporarily
      if (timeLeft > prevTimeLeft.current) {
        setShouldAnimate(false);
        // Re-enable animation after the next render
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setShouldAnimate(true);
          });
        });
      }
      prevTimeLeft.current = timeLeft;
    }, [timeLeft]);

    const strokeDashoffset = circumference * (1 - timeLeft / totalTime);

    return (
      <div className="self-end">
        <div className="relative w-14 h-14">
          <svg className="transform -rotate-90 w-14 h-14">
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`text-indigo-600 dark:text-indigo-400 ${
                shouldAnimate ? 'transition-all duration-1000 ease-linear' : 'transition-none'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-gray-700 dark:text-gray-300">
            {timeLeft}
          </div>
        </div>
      </div>
    );
  };

  export default CircularTimer;
