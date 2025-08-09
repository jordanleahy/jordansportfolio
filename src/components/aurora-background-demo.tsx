"use client";

import React from "react";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Input } from "@/components/ui/input";

export default function AuroraBackgroundDemo() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
        className="relative flex flex-col gap-6 items-center justify-center px-4 text-center"
      >
        <header>
          <h1 className="text-3xl md:text-7xl font-bold tracking-tight">
            Background lights are cool you know.
          </h1>
          <p className="font-extralight text-base md:text-2xl text-muted-foreground mt-4">
            And this, is chemical burn.
          </p>
        </header>
        <div className="w-full max-w-md">
          <Input
            placeholder="Type to explore…"
            aria-label="Hero search"
            className="h-12 md:h-14 w-full"
          />
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
