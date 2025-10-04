'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="bg-muted rounded h-4 w-3/4 mb-2" />
      <div className="bg-muted rounded h-4 w-1/2" />
    </div>
  );
}

export function LoanCardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="bg-muted rounded h-6 w-24" />
            <div className="bg-muted rounded h-4 w-32" />
          </div>
          <div className="bg-muted rounded h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="bg-muted rounded h-3 w-16" />
              <div className="bg-muted rounded h-4 w-24" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted rounded h-8 w-full" />
              <div className="bg-muted rounded h-8 w-full" />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-muted rounded-full h-20 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScoreDialSkeleton({ size = 120 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center space-y-2 animate-pulse">
      <div 
        className="bg-muted rounded-full" 
        style={{ width: size, height: size }}
      />
      <div className="space-y-1 text-center">
        <div className="bg-muted rounded h-4 w-16" />
        <div className="bg-muted rounded h-3 w-20" />
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="bg-muted rounded h-6 w-48 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-start gap-4 animate-pulse">
              <div className="bg-muted rounded-full h-8 w-8 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted rounded h-4 w-3/4" />
                <div className="bg-muted rounded h-3 w-1/2" />
                <div className="bg-muted rounded h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EndorseListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="bg-muted rounded h-6 w-56 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 animate-pulse">
          <div className="flex justify-between">
            <div className="bg-muted rounded h-4 w-24" />
            <div className="bg-muted rounded h-4 w-12" />
          </div>
          <div className="bg-muted rounded-full h-3 w-full" />
        </div>
        
        <div className="space-y-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-pulse">
              <div className="space-y-1">
                <div className="bg-muted rounded h-4 w-32" />
                <div className="bg-muted rounded h-3 w-16" />
              </div>
              <div className="bg-muted rounded h-6 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-pulse">
        <div className="bg-muted rounded h-8 w-48 mb-2" />
        <div className="bg-muted rounded h-4 w-96" />
      </div>
      
      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-6 animate-pulse">
              <div className="space-y-2">
                <div className="bg-muted rounded h-4 w-20" />
                <div className="bg-muted rounded h-8 w-16" />
                <div className="bg-muted rounded h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="bg-muted rounded h-6 w-32 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded h-64 w-full animate-pulse" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="bg-muted rounded h-6 w-40 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded h-64 w-full animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
