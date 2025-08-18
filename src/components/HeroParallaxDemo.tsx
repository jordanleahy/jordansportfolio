
import React from "react";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { getStorageImageUrl } from "@/utils/storageImageUpload";
import { CaseStudyPasswordModal } from "@/components/case-study/CaseStudyPasswordModal";
import { useCaseStudyAuth } from "@/hooks/useCaseStudyAuth";

export default function HeroParallaxDemo() {
  const { 
    showPasswordModal, 
    handleCaseStudyNavigation, 
    handleAuthentication, 
    handleCloseModal 
  } = useCaseStudyAuth();

  // Update products to use the authentication handler instead of direct links
  const productsWithAuth = products.map(product => ({
    ...product,
    onClick: () => handleCaseStudyNavigation(product.link)
  }));

  return (
    <>
      <HeroParallax products={productsWithAuth} />
      <CaseStudyPasswordModal
        isOpen={showPasswordModal}
        onClose={handleCloseModal}
        onAuthenticate={handleAuthentication}
      />
    </>
  );
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
    thumbnail: "/lovable-uploads/4380ae80-9e2b-46a2-adbf-63b2cae372e3.png",
  },
  {
    title: "Prior Authorization Workflow",
    link: "/cases/case4",
    thumbnail: "/lovable-uploads/bb27767c-ec9f-4522-8154-3fad47dd1c1d.png",
  },
  {
    title: "Healthcare Data Visualization",
    link: "/cases/case3",
    thumbnail: "/lovable-uploads/12cbb55b-7f97-40cb-9077-4cce38f35fcd.png",
  },
  {
    title: "Clinical Decision Support",
    link: "/cases/case1",
    thumbnail: "/lovable-uploads/ecd4b7f3-47a9-4714-aa6f-9151d493a164.png",
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
