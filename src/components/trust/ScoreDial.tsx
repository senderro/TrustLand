'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ScoreDialProps {
  score: number;
  size?: number;
  ariaLabel?: string;
}

export function ScoreDial({ score, size = 120, ariaLabel }: ScoreDialProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Color based on score ranges
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'stroke-emerald-500';
    if (score >= 70) return 'stroke-blue-500';
    if (score >= 40) return 'stroke-amber-500';
    return 'stroke-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Alto';
    if (score >= 40) return 'Médio';
    return 'Baixo';
  };

  return (
    <div 
      className="flex flex-col items-center space-y-2"
      role="img"
      aria-label={ariaLabel || `Score de crédito: ${score} de 100, classificação ${getScoreLabel(score)}`}
    >
      <div className="relative inline-flex">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted-foreground/20"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-500 ease-in-out",
              getScoreBgColor(score)
            )}
          />
        </svg>
        
        {/* Score text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className={cn(
              "text-2xl font-bold tabular-nums",
              getScoreColor(score)
            )}
          >
            {score}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            /100
          </span>
        </div>
      </div>
      
      {/* Score label */}
      <div className="text-center">
        <div className={cn(
          "text-sm font-semibold",
          getScoreColor(score)
        )}>
          {getScoreLabel(score)}
        </div>
        <div className="text-xs text-muted-foreground">
          Score de Crédito
        </div>
      </div>
    </div>
  );
}
