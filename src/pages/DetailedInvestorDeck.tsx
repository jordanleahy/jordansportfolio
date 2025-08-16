import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SlideContainer } from '@/components/investor/SlideContainer';
import { JourneyBeginsSlide } from '@/components/investor/slides/detailed/JourneyBeginsSlide';
import { ProblemSlide } from '@/components/investor/slides/detailed/ProblemSlide';
import { UnderstandingSlide } from '@/components/investor/slides/detailed/UnderstandingSlide';
import { SolutionSlide } from '@/components/investor/slides/detailed/SolutionSlide';
import { LandscapeSlide } from '@/components/investor/slides/detailed/LandscapeSlide';
import { MarketOpportunitySlide } from '@/components/investor/slides/detailed/MarketOpportunitySlide';
import { BusinessModelSlide } from '@/components/investor/slides/detailed/BusinessModelSlide';
import { TractionSlide } from '@/components/investor/slides/detailed/TractionSlide';
import { CompetitiveSlide } from '@/components/investor/slides/detailed/CompetitiveSlide';
import { TeamSlide } from '@/components/investor/slides/detailed/TeamSlide';
import { RoadmapSlide } from '@/components/investor/slides/detailed/RoadmapSlide';
import { FundingAskSlide } from '@/components/investor/slides/detailed/FundingAskSlide';
import { WhyNowSlide } from '@/components/investor/slides/detailed/WhyNowSlide';
import { ThankYouSlide } from '@/components/investor/slides/detailed/ThankYouSlide';

const DetailedInvestorDeck: React.FC = () => {
  const handleSlideChange = (index: number) => {
    console.log('Detailed slide changed to:', index + 1);
  };

  return (
    <>
      <Helmet>
        <title>Story Ship - Detailed Investor Deck | Transform Thoughts Into Visual Stories</title>
        <meta 
          name="description" 
          content="Comprehensive Story Ship investor presentation - Detailed business plan for turning thoughts into immersive visual stories. $3.5M funding round to scale our innovative platform." 
        />
        <meta name="keywords" content="Story Ship, detailed investor deck, AI storytelling, visual narratives, seed funding, startup pitch" />
        <meta property="og:title" content="Story Ship - Detailed Investor Deck" />
        <meta property="og:description" content="Comprehensive investor presentation showing how Story Ship transforms thoughts into visual stories. See our detailed business plan and funding requirements." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/investor-deck/detail" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <SlideContainer onSlideChange={handleSlideChange}>
          <JourneyBeginsSlide />
          <ProblemSlide />
          <UnderstandingSlide />
          <SolutionSlide />
          <LandscapeSlide />
          <MarketOpportunitySlide />
          <BusinessModelSlide />
          <TractionSlide />
          <CompetitiveSlide />
          <TeamSlide />
          <RoadmapSlide />
          <FundingAskSlide />
          <WhyNowSlide />
          <ThankYouSlide />
        </SlideContainer>
      </div>
    </>
  );
};

export default DetailedInvestorDeck;