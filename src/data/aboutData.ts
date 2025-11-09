import { Heart, Mountain, Star, Book, Camera, Compass, type LucideIcon } from "lucide-react";

export interface AboutValue {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface AboutLifeStory {
  chapter: string;
  image: string;
  paragraphs: string[];
}

export interface AboutHobby {
  icon: LucideIcon;
  name: string;
  description: string;
}

export interface AboutPhoto {
  url: string;
  caption: string;
  featured: boolean;
}

export interface AboutGoal {
  title: string;
  description: string;
}

export interface AboutData {
  hero: {
    title: string;
    subtitle: string;
  };
  values: AboutValue[];
  lifeStories: AboutLifeStory[];
  hobbies: AboutHobby[];
  photoGallery: AboutPhoto[];
  goals: AboutGoal[];
  closing: {
    title: string;
    message: string;
  };
}

export const aboutData: AboutData = {
  hero: {
    title: "Who I Really Am",
    subtitle: "Design is how I understand people and systems. Every detail tells a story about intent, empathy, and clarity."
  },
  values: [
    {
      icon: Heart,
      title: "Empathy First",
      description: "I start with people, not pixels. Every product decision begins by understanding the human need behind it."
    },
    {
      icon: Mountain,
      title: "Clarity Over Complexity",
      description: "I believe the best design makes hard things easy to understand. Simplicity builds trust and drives adoption."
    },
    {
      icon: Star,
      title: "Consistency Builds Confidence",
      description: "Whether in design systems or relationships, consistency creates alignment, speed, and credibility."
    }
  ],
  lifeStories: [
    {
      chapter: "Chapter 1: From Healthcare Chaos to Clarity",
      image: "/photos/healthcare-design.jpg",
      paragraphs: [
        "Early in my career, I joined a healthcare startup where data was scattered and decisions were slow. I learned how design could bring structure to chaos.",
        "Working with clinicians taught me that clarity saves time, and time saves lives. That lesson shaped how I approach every product since."
      ]
    },
    {
      chapter: "Chapter 2: Snowboarding With My Daughter",
      image: "/photos/dandan-snowboard.jpg",
      paragraphs: [
        "Every weekend, my daughter Don Don and I snowboard together at Big Snow. It started as a hobby but became a lesson in patience, progress, and presence.",
        "We turned her learning moments into children's books that help other parents teach through storytelling. It's my favorite blend of design, family, and purpose."
      ]
    }
  ],
  hobbies: [
    {
      icon: Book,
      name: "Writing",
      description: "I write short pieces about design leadership, clarity, and decision-making."
    },
    {
      icon: Mountain,
      name: "Snowboarding",
      description: "Snowboarding keeps me grounded. It's where I reset and find perspective."
    },
    {
      icon: Compass,
      name: "Travel",
      description: "Exploring new cities helps me see how culture shapes design choices."
    },
    {
      icon: Camera,
      name: "Photography",
      description: "I capture visual stories about people, motion, and stillness."
    },
    {
      icon: Heart,
      name: "Family Time",
      description: "Family comes first. Most of my best ideas start from time spent with them."
    },
    {
      icon: Star,
      name: "AI Experiments",
      description: "I explore how AI helps designers move faster without losing intent or empathy."
    }
  ],
  photoGallery: [
    {
      url: "/photos/dandan-snowboard.jpg",
      caption: "Don Don's first solo ride at Big Snow",
      featured: true
    },
    {
      url: "/photos/family-park.jpg",
      caption: "Weekend walks through NYC parks",
      featured: false
    },
    {
      url: "/photos/workshop.jpg",
      caption: "Leading a design thinking workshop for nurses",
      featured: false
    },
    {
      url: "/photos/mountain-view.jpg",
      caption: "Plattekill summit view after a long session",
      featured: true
    },
    {
      url: "/photos/desk-setup.jpg",
      caption: "My late-night design setup",
      featured: false
    },
    {
      url: "/photos/snowboard-stickers.jpg",
      caption: "Custom stickers for Don Don's snowboarding crew",
      featured: false
    },
    {
      url: "/photos/city-lights.jpg",
      caption: "New York City skyline after a workday",
      featured: false
    },
    {
      url: "/photos/book-cover.jpg",
      caption: "Cover from our first children's snowboarding book",
      featured: false
    }
  ],
  goals: [
    {
      title: "Lead in Clinical AI Design",
      description: "Build healthcare AI interfaces that improve accuracy and trust in medical decision-making."
    },
    {
      title: "Mentor the Next Generation",
      description: "Help designers navigate healthcare complexity and bring purpose to their work."
    },
    {
      title: "Create Family Legacy Projects",
      description: "Continue developing educational books and creative media with my daughter."
    },
    {
      title: "Balance Work and Presence",
      description: "Keep designing at a high level while making time for family and exploration."
    }
  ],
  closing: {
    title: "Keep Building What Matters",
    message: "I design to help people make sense of complexity. Every pixel, story, and product is an effort to make the world a bit clearer—and to show my daughter the value of creating with purpose."
  }
};
