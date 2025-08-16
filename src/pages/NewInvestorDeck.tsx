import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SlideContainer } from '@/components/investor/SlideContainer';
import { TitleSlide } from '@/components/investor/slides/TitleSlide';
import { IntroSlide } from '@/components/investor/slides/IntroSlide';
import { MissingLinkSlide } from '@/components/investor/slides/MissingLinkSlide';
import { MarketSlide } from '@/components/investor/slides/MarketSlide';
import { PricingSlide } from '@/components/investor/slides/PricingSlide';
import { LiveSlide } from '@/components/investor/slides/LiveSlide';
import { FounderSlide } from '@/components/investor/slides/FounderSlide';
import { FundingSlide } from '@/components/investor/slides/FundingSlide';

const NewInvestorDeck: React.FC = () => {
  const handleSlideChange = (index: number) => {
    console.log('Slide changed to:', index + 1);
  };

  return (
    <>
      <Helmet>
        <title>Story Ship - Investor Deck | Turn Thoughts Into Visual Stories</title>
        <meta 
          name="description" 
          content="Story Ship investor presentation - Turn fleeting thoughts into vivid visual stories instantly. $1.5M funding round to scale what already works." 
        />
        <meta name="keywords" content="Story Ship, investor deck, AI storytelling, visual stories, funding, startup" />
        <meta property="og:title" content="Story Ship - Investor Deck" />
        <meta property="og:description" content="Turn fleeting thoughts into vivid visual stories instantly. See our investor presentation." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/investor-deck" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <SlideContainer onSlideChange={handleSlideChange}>
          <TitleSlide />
          <IntroSlide />
          <MissingLinkSlide />
          <MarketSlide />
          <PricingSlide />
          <LiveSlide />
          <FounderSlide />
          <FundingSlide />
        </SlideContainer>
      </div>
    </>
  );
};

export default NewInvestorDeck;