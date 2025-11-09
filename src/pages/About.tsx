import React from "react";
import { Helmet } from "react-helmet-async";
import AppLayout from "@/components/layout/AppLayout";
import { generateSEOMetadata } from "@/utils/seoHelpers";
import { motion } from "framer-motion";
import { Heart, Mountain, Book, Camera, Compass, Star } from "lucide-react";

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
        {/* Hero Section - Full screen photo with overlay */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4')] bg-cover bg-center opacity-30" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center px-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
              [WIREFRAME] Who I Really Am
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              [Add your opening statement/quote here - something personal and authentic]
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
              <p className="text-muted-foreground text-lg">[WIREFRAME] What guides me in life</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Heart, title: "Value 1", desc: "Description of your first core value" },
                { icon: Mountain, title: "Value 2", desc: "Description of your second core value" },
                { icon: Star, title: "Value 3", desc: "Description of your third core value" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow"
                >
                  <item.icon className="w-12 h-12 mb-4 text-primary" />
                  <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Life Story - Photo + Text Split */}
        <section className="py-24 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Camera className="w-24 h-24 text-muted-foreground" />
                  <span className="ml-4 text-muted-foreground">[Photo placeholder 1]</span>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold mb-6">Chapter 1: [Life Story Title]</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  [Add your first life story/experience here - make it personal and authentic. This could be about your childhood, a pivotal moment, or an important journey.]
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  [Continue the story with more details and reflections...]
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-2 md:order-1"
              >
                <h2 className="text-4xl font-bold mb-6">Chapter 2: [Life Story Title]</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  [Add your second life story/experience here]
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  [Continue with more reflections...]
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-1 md:order-2"
              >
                <div className="aspect-square rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                  <Camera className="w-24 h-24 text-muted-foreground" />
                  <span className="ml-4 text-muted-foreground">[Photo placeholder 2]</span>
                </div>
              </motion.div>
            </div>
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
              <p className="text-muted-foreground text-lg">[WIREFRAME] My passions and hobbies</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 hover:shadow-xl transition-all"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    {i === 0 && <Book className="w-16 h-16 mb-4 text-primary" />}
                    {i === 1 && <Mountain className="w-16 h-16 mb-4 text-primary" />}
                    {i === 2 && <Compass className="w-16 h-16 mb-4 text-primary" />}
                    {i === 3 && <Camera className="w-16 h-16 mb-4 text-primary" />}
                    {i === 4 && <Heart className="w-16 h-16 mb-4 text-primary" />}
                    {i === 5 && <Star className="w-16 h-16 mb-4 text-primary" />}
                    <h3 className="text-xl font-semibold mb-2">[Hobby {i + 1}]</h3>
                    <p className="text-sm text-muted-foreground">[Brief description]</p>
                  </div>
                </motion.div>
              ))}
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
              <p className="text-muted-foreground text-lg">[WIREFRAME] Moments that matter to me</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 ${
                    i === 0 || i === 3 ? 'col-span-2 row-span-2' : 'aspect-square'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-muted-foreground">[Photo {i + 1}]</span>
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
                [WIREFRAME] Share your dreams, goals, and aspirations for the future. What drives you? What are you working towards? What kind of life do you want to build?
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                {[1, 2, 3, 4].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-lg border border-border bg-card"
                  >
                    <h3 className="text-xl font-semibold mb-3">[Goal/Aspiration {i + 1}]</h3>
                    <p className="text-muted-foreground">[Describe this personal goal or aspiration]</p>
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
                [WIREFRAME] Closing Thought
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                [Add a meaningful closing statement - something that encapsulates who you are and what matters most to you]
              </p>
            </motion.div>
          </div>
        </section>
      </AppLayout>
    </>
  );
};

export default About;
