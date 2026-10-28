"use client";

import { Wifi, BatteryFull, Signal } from "lucide-react";

export function StatusBar() {
  return (
    <div className="status-bar">
      <span>09:41</span>
      <div className="flex items-center gap-1.5">
        <Signal size={11} className="text-[#FF6B5C]" />
        <Wifi size={11} className="text-[#FF6B5C]" />
        <BatteryFull size={11} className="text-[#FF6B5C]" />
      </div>
    </div>
  );
}
