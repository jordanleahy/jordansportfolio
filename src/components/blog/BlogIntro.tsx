interface BlogIntroProps {
  content: string;
  className?: string;
}

export const BlogIntro = ({ content, className = "" }: BlogIntroProps) => {
  return (
    <section className={`max-w-3xl mx-auto px-4 ${className}`}>
      <div className="prose prose-lg max-w-none">
        <p className="text-lg md:text-xl leading-relaxed text-foreground/90 first-letter:text-4xl first-letter:font-bold first-letter:text-primary first-letter:mr-1 first-letter:float-left first-letter:leading-none first-letter:mt-1">
          {content}
        </p>
      </div>
    </section>
  );
};