import React from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";
export const HeroParallax = ({
  products
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
    onClick?: () => void;
  }[];
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  const springConfig = {
    stiffness: 300,
    damping: 30,
    bounce: 100
  };
  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1000]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-400, 200]), springConfig);
  return <div ref={ref} className="h-[150vh] py-20 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d] bg-white">
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/92 to-white/98 z-10 pointer-events-none" />
      <Header />
      <motion.div style={{
      rotateX,
      rotateZ,
      translateY,
      opacity
    }} className="">
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
          {firstRow.map(product => <ProductCard product={product} translate={translateX} key={product.title} />)}
        </motion.div>
        <motion.div className="flex flex-row mb-20 space-x-20">
          {secondRow.map(product => <ProductCard product={product} translate={translateXReverse} key={product.title} />)}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
          {thirdRow.map(product => <ProductCard product={product} translate={translateX} key={product.title} />)}
        </motion.div>
      </motion.div>
    </div>;
};
export const Header = () => {
  return <div className="max-w-7xl relative mx-auto py-20 md:py-40 px-4 w-full left-0 top-0 z-20">
      <div className="text-[14px] font-medium text-accent leading-[24px] tracking-[1.12px] uppercase mb-4">
        JORDAN LEAHY
      </div>
      <h1 className="text-2xl md:text-[64px] font-medium text-primary md:leading-[70.4px] drop-shadow-sm">
        Clinical AI Product Designer
      </h1>
      <p className="max-w-2xl text-[18px] md:text-[18px] mt-8 font-normal leading-[27px] tracking-[-0.18px] text-black drop-shadow-sm">I'm focused on identifying repetitive manual tasks in revenue cycle and automating them using AI and thoughtful, user-centered design.</p>
      <div className="mt-8">
        <a 
          href="mailto:jordanwilliamleahy@gmail.com"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-all duration-300 shadow-accent-md hover:shadow-accent-lg"
        >
          Contact Me
        </a>
      </div>
    </div>;
};
export const ProductCard = ({
  product,
  translate
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
    onClick?: () => void;
  };
  translate: MotionValue<number>;
}) => {
  const handleClick = () => {
    if (product.onClick) {
      product.onClick();
    } else {
      window.open(product.link, '_blank');
    }
  };
  return <motion.div style={{
    x: translate
  }} whileHover={{
    y: -20
  }} key={product.title} className="group/product h-96 w-[30rem] relative shrink-0 group-hover/product:shadow-2xl cursor-pointer" onClick={handleClick}>
      <img src={product.thumbnail} alt={product.title} className="object-cover object-left-top absolute h-full w-full inset-0" width={600} height={600} loading="lazy" />
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white">
        {product.title}
      </h2>
    </motion.div>;
};