
interface BlogIntroProps {
  content: string;
  className?: string;
}

export const BlogIntro = ({ content, className = "" }: BlogIntroProps) => {
  return (
    <div className={`py-12 px-4 ${className}`}>
      <div className="max-w-3xl mx-auto">
        <div className="prose prose-lg max-w-none">
          <p className="text-body-lg md:text-heading-sm leading-relaxed text-foreground/90 first-letter:text-display-lg first-letter:font-bold first-letter:text-primary first-letter:mr-1 first-letter:float-left first-letter:leading-none first-letter:mt-1">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
};
