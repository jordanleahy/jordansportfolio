
import React from "react";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { getStorageImageUrl } from "@/utils/storageImageUpload";

export default function HeroParallaxDemo() {
  return <HeroParallax products={products} />;
}

export const products = [
  {
    title: "Pre-bill CDI Validation Dashboard",
    link: "/cases/case1",
    thumbnail: getStorageImageUrl("f8bdf34c-98f3-483b-9033-2c28bda929cd.png"),
  },
  {
    title: "Drug Prior Auth and Validation",
    link: "/cases/case4",
    thumbnail: getStorageImageUrl("4be80a48-e90b-4b76-af9c-259fe703976d.png"),
  },
  {
    title: "Research & Discovery Process",
    link: "/cases/case3",
    thumbnail: getStorageImageUrl("f8bdf34c-98f3-483b-9033-2c28bda929cd.png"),
  },
  {
    title: "Ideation & Concepting Phase",
    link: "/cases/case3",
    thumbnail: getStorageImageUrl("3e1c498e-aaa3-49a7-a2ee-5c4b772223fb.png"),
  },
  {
    title: "Prototyping & Validation",
    link: "/cases/case3",
    thumbnail: getStorageImageUrl("dfaaf33d-9dd1-4c76-8be2-bba0c4b46d98.png"),
  },
  {
    title: "Iteration & Handoff Process",
    link: "/cases/case3",
    thumbnail: getStorageImageUrl("8558410b-841e-412e-a8ce-ef6084e9a684.png"),
  },
  {
    title: "AI-Powered CDI Tools",
    link: "/cases/case1",
    thumbnail: getStorageImageUrl("873ce045-f694-4990-8de2-acc4f4137e86.png"),
  },
  {
    title: "Prior Authorization Workflow",
    link: "/cases/case4",
    thumbnail: getStorageImageUrl("9e1e9048-62fc-4392-91bd-a5a82b8d5e42.png"),
  },
  {
    title: "Healthcare Data Visualization",
    link: "/cases/case3",
    thumbnail: "https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/images//Day%201%20What%20Is%20Clinical%20Documentation%20Integrity%20%20169.png",
  },
  {
    title: "Clinical Decision Support",
    link: "/cases/case1",
    thumbnail: getStorageImageUrl("d16887ac-0992-4a5a-84f5-043c66a1acd3.png"),
  },
  {
    title: "Revenue Cycle Management",
    link: "/cases/case1",
    thumbnail: getStorageImageUrl("ed730bb1-ba72-46ce-bfa8-1a7aa1f8e60d.png"),
  },
  {
    title: "Healthcare UX Design",
    link: "/cases/case3",
    thumbnail: getStorageImageUrl("4be80a48-e90b-4b76-af9c-259fe703976d.png"),
  },
  {
    title: "Medical Coding Tools",
    link: "/cases/case4",
    thumbnail: "https://wgwmzfbnkovumqcvsxgd.supabase.co/storage/v1/object/public/images/hero-parallax/8c1110c1-02c2-4041-987c-a9d030ffef3b.png",
  },
  {
    title: "Healthcare Analytics Platform",
    link: "/cases/case1",
    thumbnail: getStorageImageUrl("4c976661-d94f-48e5-ab44-e69c629f2f91.png"),
  },
  {
    title: "Clinical Operations Dashboard",
    link: "/cases/case1",
    thumbnail: getStorageImageUrl("762c3624-2485-4556-b7c7-63709fc409aa.png"),
  },
];
