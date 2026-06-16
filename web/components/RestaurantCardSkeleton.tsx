"use client";

import React from "react";

const RestaurantCardSkeleton: React.FC = () => (
  <div
    className="bg-circle-card rounded-[2rem] p-8 border border-circle-border flex flex-col gap-6 animate-pulse"
    aria-hidden
  >
    <div className="flex justify-between items-start">
      <div className="h-10 w-2/3 rounded-xl bg-circle-text/10" />
      <div className="h-8 w-16 rounded-full bg-circle-text/10" />
    </div>
    <div className="space-y-3">
      <div className="h-4 w-full rounded bg-circle-text/10" />
      <div className="h-4 w-5/6 rounded bg-circle-text/10" />
      <div className="h-4 w-4/6 rounded bg-circle-text/10" />
    </div>
    <div className="flex gap-3 mt-auto">
      <div className="h-14 flex-1 rounded-2xl bg-circle-text/10" />
      <div className="h-14 w-14 rounded-2xl bg-circle-text/10" />
    </div>
  </div>
);

export function RestaurantListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {Array.from({ length: count }).map((_, i) => (
        <RestaurantCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default RestaurantCardSkeleton;
