import { CaseStudyLayout } from "@/components/case-study/CaseStudyLayout";
import { case1Data } from "@/data/case1Data";

const Case1 = () => {
  return <CaseStudyLayout data={case1Data} path="/cases/case1" />;
};

export default Case1;