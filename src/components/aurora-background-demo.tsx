"use client";

import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Input } from "@/components/ui/input";

export default function AuroraBackgroundDemo() {
  return (
    <AuroraBackground>
      <div className="relative flex flex-col gap-4 items-center justify-center px-4">
        <div className="text-3xl md:text-7xl font-bold text-center">
          Background lights are cool you know.
        </div>
        <div className="font-extralight text-base md:text-4xl text-muted-foreground py-4">
          And this, is chemical burn.
        </div>
        <div className="w-full max-w-md">
          <Input placeholder="Type here..." />
        </div>
      </div>
    </AuroraBackground>
  );
}
