import React, { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import AppLayout from "@/components/layout/AppLayout";
import ContactSection from "@/components/ContactSection";
import { generateSEOMetadata } from "@/utils/seoHelpers";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { aboutData } from "@/data/aboutData";

// Lazy load heavy HeroParallax component
const HeroParallaxDemo = lazy(() => import("@/components/HeroParallaxDemo"));

const About = () => {
  const aboutSEO = generateSEOMetadata({
    title: "About Jordan Leahy - My Personal Journey",
    description: "Get to know the real Jordan Leahy - my values, passions, life experiences, and what makes me who I am.",
    image: "/lovable-uploads/a3482ced-732a-40a0-95b4-3199495f0f4f.png",
    url: "/about",
    type: "website"
  });

  return (
    <>
      <Helmet>
        <title>{aboutSEO.title}</title>
        <meta name="description" content={aboutSEO.description} />
        <meta property="og:title" content={aboutSEO.ogTitle} />
        <meta property="og:description" content={aboutSEO.ogDescription} />
        <meta property="og:image" content={aboutSEO.image} />
        <meta property="og:url" content={aboutSEO.url} />
        <meta property="og:type" content={aboutSEO.type} />
        <meta property="og:site_name" content={aboutSEO.siteName} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={aboutSEO.ogTitle} />
        <meta name="twitter:description" content={aboutSEO.ogDescription} />
        <meta name="twitter:image" content={aboutSEO.image} />
      </Helmet>
      <AppLayout>
        {/* Hero Parallax Section - Reused from home */}
        <Suspense fallback={
          <div className="h-screen bg-gradient-to-b from-background to-background/50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading hero section...</p>
            </div>
          </div>
        }>
          <HeroParallaxDemo />
        </Suspense>

        {/* Custom hero overlay for personal message */}
        <section className="relative py-24 px-4 bg-gradient-to-b from-background/50 to-background">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              {aboutData.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              {aboutData.hero.subtitle}
            </p>
          </motion.div>
        </section>

        {/* Personal Values & Philosophy */}
        <section className="py-24 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">My Values & Philosophy</h2>
              <p className="text-muted-foreground text-lg">What guides me in life</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {aboutData.values.map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow"
                  >
                    <IconComponent className="w-12 h-12 mb-4 text-primary" />
                    <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Life Story - Photo + Text Split */}
        <section className="py-24 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            {aboutData.lifeStories.map((story, index) => (
              <div 
                key={index}
                className={`grid md:grid-cols-2 gap-12 items-center ${index > 0 ? 'mt-24' : ''}`}
              >
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={index % 2 === 0 ? '' : 'order-2 md:order-1'}
                >
                  {index % 2 === 0 ? (
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Camera className="w-24 h-24 text-muted-foreground" />
                      <span className="ml-4 text-muted-foreground">[{story.image}]</span>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-4xl font-bold mb-6">{story.chapter}</h2>
                      {story.paragraphs.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-lg text-muted-foreground leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </>
                  )}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className={index % 2 === 0 ? '' : 'order-1 md:order-2'}
                >
                  {index % 2 === 0 ? (
                    <>
                      <h2 className="text-4xl font-bold mb-6">{story.chapter}</h2>
                      {story.paragraphs.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-lg text-muted-foreground leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </>
                  ) : (
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <Camera className="w-24 h-24 text-muted-foreground" />
                      <span className="ml-4 text-muted-foreground">[{story.image}]</span>
                    </div>
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* Hobbies & Interests - Photo Grid */}
        <section className="py-24 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">What I Love Doing</h2>
              <p className="text-muted-foreground text-lg">My passions and hobbies</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {aboutData.hobbies.map((hobby, i) => {
                const IconComponent = hobby.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 hover:shadow-xl transition-all"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <IconComponent className="w-16 h-16 mb-4 text-primary" />
                      <h3 className="text-xl font-semibold mb-2">{hobby.name}</h3>
                      <p className="text-sm text-muted-foreground">{hobby.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Photo Memories Gallery */}
        <section className="py-24 px-4 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Life in Pictures</h2>
              <p className="text-muted-foreground text-lg">Moments that matter to me</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {aboutData.photoGallery.map((photo, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 ${
                    photo.featured ? 'col-span-2 row-span-2' : 'aspect-square'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                    <div>
                      <span className="text-muted-foreground block mb-2">[{photo.url}]</span>
                      {photo.caption && (
                        <span className="text-xs text-muted-foreground">{photo.caption}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Personal Goals & Aspirations */}
        <section className="py-24 px-4 bg-background">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8">Where I'm Headed</h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-12">
                My dreams, goals, and aspirations for the future
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                {aboutData.goals.map((goal, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-lg border border-border bg-card"
                  >
                    <h3 className="text-xl font-semibold mb-3">{goal.title}</h3>
                    <p className="text-muted-foreground">{goal.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Closing Section */}
        <section className="py-24 px-4 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {aboutData.closing.title}
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {aboutData.closing.message}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Section - Reused from home */}
        <ContactSection />
      </AppLayout>
    </>
  );
};

export default About;
