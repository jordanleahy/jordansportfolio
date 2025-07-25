import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';

export default function ChartTypeCoverageCost() {
  return (
    <PageLayout>
      <Helmet>
        <title>Chart Type Coverage, Automation & Cost Analysis</title>
        <meta 
          name="description" 
          content="Comprehensive analysis of chart type coverage, automation percentages, accuracy rates, and processing costs across U.S. healthcare coding categories." 
        />
      </Helmet>
      
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Chart Type Coverage, Automation & Cost Analysis
            </h1>
            <p className="text-lg text-muted-foreground">
              Below we break down each chart type category with available data on its prevalence in U.S. healthcare ("% Covered"), 
              the extent of coding automation in use, reported accuracy of CAC/CDI tools, and typical cost per chart for coding services.
            </p>
          </div>

          {/* Section 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                1. Outpatient – Low Complexity (In-Office, Low-Cost Visits)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">% Covered:</h4>
                <p className="text-sm leading-relaxed">
                  This category (e.g. routine office visits, lab tests, radiology reads) represents a huge volume of encounters. 
                  U.S. physician offices see about <strong>1.0 billion visits/year</strong>, and <strong>lab tests</strong> number 
                  in the <strong>double-digit billions annually</strong> – making low-complexity outpatient services the majority 
                  of healthcare encounters by volume.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Automation %:</h4>
                <p className="text-sm leading-relaxed">
                  A very high portion of these simple charts can be automated. Many ancillary services are auto-coded via order entry 
                  (lab orders generate CPT codes, etc.). In radiology, <strong>over 90% of cases can be coded autonomously</strong> with 
                  AI in leading systems. One academic center's AI achieved <strong>92% of radiology studies coded without human intervention</strong>. 
                  Routine office E/M visits also see partial automation (e.g. template-driven EHR coding). Overall, it's common for the 
                  <strong>majority of low-complexity charts (perhaps ~80%+) to be auto-coded or require minimal human input</strong>, 
                  given the structured nature of these services.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Accuracy %:</h4>
                <p className="text-sm leading-relaxed">
                  <strong>For straightforward cases, automation accuracy is very high. Vendors report 95–99%+ coding accuracy</strong> 
                  on these charts. For example, an autonomous coding engine attained <strong>≈98% accuracy</strong> on outpatient charts 
                  in practice, and AHIMA notes <strong>"96% code-over-code accuracy"</strong> for autonomous coding across most outpatient 
                  specialties. In other words, auto-coders can match human coders on ~96–99% of codes for low-complexity services. 
                  Human oversight is still used to catch rare errors, but the agreement with manual coding is extremely high in this category.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">$/chart:</h4>
                <p className="text-sm leading-relaxed">
                  Low-complexity outpatient charts are the least expensive to process. Many coding vendors charge <strong>well under $1 per chart</strong> 
                  for things like radiology or lab reports. (In one example, radiology coding paid <strong>$0.45 per report using an automated 
                  system vs $0.57 manually</strong>.) It's not uncommon for routine office visit coding to cost on the order of 
                  <strong>$1–$2 per chart</strong> in outsourcing arrangements. These low rates reflect the efficiency of high-volume, 
                  template-driven coding for simple visits.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2a */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                2a. Outpatient – Moderate Complexity (Professional & Procedural)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">% Covered:</h4>
                <p className="text-sm leading-relaxed">
                  This includes mid-level outpatient encounters – e.g. GI endoscopies, cardiac cath lab, oncology infusions, moderate ER visits. 
                  These are very common but slightly less so than routine visits. For instance, <strong>Emergency Departments handle ~155 million visits per year</strong>, 
                  and roughly <strong>two-thirds of ED cases are moderate-to-high acuity (Level 4 or 5 E/M)</strong>. Similarly, millions of GI and 
                  same-day procedural visits occur annually. In sum, moderate-complexity outpatient services comprise a substantial share 
                  (tens of millions) of encounters – a significant <strong>fraction of outpatient volume, though not as dominant as the low-complexity tier</strong>.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Automation %:</h4>
                <p className="text-sm leading-relaxed">
                  Automation here is growing but not universal. <strong>Computer-Assisted Coding (CAC) is widely adopted</strong> to assist coders – 
                  nearly <em>70% of hospitals</em> using CAC report improved efficiency. Fully <strong>autonomous coding is emerging</strong> in certain 
                  domains (e.g. AI engines auto-code ~<strong>50% of ED charts</strong> at 98% accuracy in pilot programs). One health system achieved 
                  an <strong>86% overall automation rate</strong> on targeted outpatient cases with AI. However, for many procedural specialties, 
                  current practice is <strong>"CAC-assisted" rather than 100% automated</strong> – the software suggests codes and humans validate. 
                  We can estimate perhaps <strong>30–60% of coding tasks can be partially or fully automated</strong> in this category, depending on 
                  the setting and tool. For example, <strong>ED professional coding</strong> is a focus of new AI solutions, while things like 
                  infusion therapy still rely more on manual coding.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Accuracy %:</h4>
                <p className="text-sm leading-relaxed">
                  Reported accuracy for CAC/AI on moderate-complexity charts is improving. <strong>High-performing AI engines in ED coding claim ~95–98% accuracy</strong> 
                  in assigning correct CPT/ICD codes. In general, vendors often guarantee <strong>95%+ agreement</strong> with expert human coders for 
                  outpatient CAC. It's worth noting accuracy can vary by specialty – e.g. oncology infusion coding is trickier for software than 
                  standard ED E/M. Without human review, errors can creep in (one study saw a <strong>12–15% increase in discrepancies</strong> if CAC 
                  suggestions weren't reviewed by a coder). Thus, <strong>when properly implemented with oversight, automation can consistently exceed 
                  90–95% accuracy in this group</strong>, approaching human coder quality.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">$/chart:</h4>
                <p className="text-sm leading-relaxed">
                  Costs per chart are moderate. Outsourced coding for an ED visit or similar typically runs a few dollars each. Industry sources 
                  indicate <strong>about $3–$5 per moderate outpatient chart</strong> is common. (On coding platforms, <strong>typical earnings range from 
                  ~$1 for very simple charts up to ~$30 for the most complex, with moderate cases falling in the low-single-digit dollars</strong>.) 
                  For example, coding a standard ER visit might be priced around $3, whereas a minor surgical procedure could be $5 or more. 
                  The price reflects greater complexity than a lab report but still relatively efficient to code in volume.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2b */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                2b. Outpatient – Moderate Complexity (Facility Billing)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">% Covered:</h4>
                <p className="text-sm leading-relaxed">
                  This refers to facility-side coding for outpatient procedures (e.g. hospital outpatient surgeries, recovery room charges, 
                  ambulatory surgery centers). Outpatient surgeries now constitute about <strong>half of all surgeries in U.S. hospitals</strong> – 
                  a dramatic rise over the past two decades. In 2018, ~<strong>48% of elective operations</strong> were performed outpatient 
                  (vs ~38% in 2005). This means a <strong>huge volume (likely 10+ million cases/year)</strong> of same-day surgeries and similar 
                  encounters that require facility coding. So, moderate-complexity outpatient facility charts make up a <strong>significant segment 
                  of hospital coding workload</strong>, rivaling inpatient surgical volumes.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Automation %:</h4>
                <p className="text-sm leading-relaxed">
                  Many hospitals use CAC and <strong>other automation aids for outpatient facility coding</strong>, but full automation is rare. 
                  These cases often involve complex coding of procedures, supplies, and APC group assignments, which still need expert coders. 
                  <strong>CAC is nonetheless used to speed up coding</strong> – surveys show most organizations implementing CAC see productivity 
                  gains in outpatient facility coding. Additionally, portions of facility coding (like charge capture for meds, supplies) can be 
                  <strong>rule-driven/automated in the EHR</strong>. Overall, we might estimate perhaps <strong>20–40% of the coding work is automated 
                  or autogenerated</strong> (e.g. via chargemasters, templates), with the remainder done by humans using software assistance. 
                  The industry "standard" is human coder oversight for outpatient facility claims, with CAC reducing keystrokes but 
                  <strong>not fully replacing coders</strong> in this category.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Accuracy %:</h4>
                <p className="text-sm leading-relaxed">
                  Vendors often tout very high accuracy for outpatient facility coding when using a human+CAC process – frequently 
                  <strong>95–99% coding accuracy</strong> is reported. In practice, <strong>human coders augmented by CAC produce ~98-99% clean claims</strong> 
                  on facility outpatient encounters (many vendors advertise ~99% accuracy in coding results with dual reviews). Pure automation 
                  alone is less proven here – complex outpatient surgeries involve nuances that CAC may miss. Case studies stress that 
                  <strong>coder validation plus CAC yields near-99% accuracy</strong>. So, while <strong>automation improves consistency, facility coding 
                  accuracy still ultimately depends on skilled human review to reach 95%+ agreement with documentation.</strong>
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">$/chart:</h4>
                <p className="text-sm leading-relaxed">
                  The coding cost per outpatient facility chart tends to be higher than for professional claims. An ambulatory surgery case 
                  requires coding of multiple items and typically commands <strong>on the order of $5–$10 per chart</strong> in outsourcing fees 
                  (varies by complexity of the procedure). Exact prices are not always public, but by comparison, simple radiology was under $1,
                  whereas a same-day surgery might be an order of magnitude higher. Indeed, <strong>coding vendors pay certified coders more for 
                  facility cases; one coder noted facility outpatient charts had better pay rates</strong>. As a ballpark, <strong>mid-single-digit 
                  to low-double-digit dollars per chart</strong> is common for outpatient facility coding, depending on how complex the surgery 
                  or encounter is. (For example, a minor outpatient surgery might be ~$5, whereas an extensive same-day surgery with many lines 
                  could be closer to $10+.)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3a */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                3a. Outpatient – High Complexity (Professional & Procedural)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">% Covered:</h4>
                <p className="text-sm leading-relaxed">
                  These are the most complex outpatient encounters, such as <strong>Level 5 ED visits, critical care services, or complex oncology visits.</strong> 
                  They are a smaller subset of outpatient volume. For instance, <strong>ED Level 5 visits</strong> (highest acuity) were the 
                  <strong>second most common ED code by 2017</strong> – together with Level 4 they made up 66% of ED visits. So while high-complexity 
                  cases are not the majority, they still number in the tens of millions annually (e.g. tens of millions of ED visits coded at level 5 or 
                  critical care). Complex oncology or specialty clinic visits are fewer, but growing as more care shifts outpatient. In summary, 
                  this category represents a <strong>notable but minority share of outpatient charts</strong> – the sickest patients seen outside 
                  the inpatient setting (perhaps on the order of 10–20% of outpatient encounters).
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Automation %:</h4>
                <p className="text-sm leading-relaxed">
                  Fully automating high-complexity outpatient coding is <strong>just beginning.</strong> Advanced AI systems (like autonomous ED coding engines) 
                  have shown it's possible – for example, one hospital's AI now autonomously codes <strong>50%+ of high-acuity ED charts</strong> in real time. 
                  However, these are early adopters. Generally, <strong>most organizations still rely heavily on human coders for critical care and complex 
                  procedure visits</strong>, with CAC offering suggestions. Automation might handle straightforward portions (e.g. certain procedure codes) 
                  but <strong>overall automation rates are low – likely under 30%</strong> for end-to-end coding on these charts at present. One reason is that 
                  complex charts often have nuanced documentation that <strong>"flawed automation" can misinterpret, especially with multiple comorbidities 
                  or intricate procedures</strong>. So, while the <strong>trend is toward more automation (especially in ED coding)</strong>, currently 
                  <strong>the majority of high-complexity pro-fee coding is still manual</strong>, with perhaps only targeted tasks (like pulling diagnoses 
                  from notes) automated.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Accuracy %:</h4>
                <p className="text-sm leading-relaxed">
                  When automation is applied, reported accuracy can still be high – <em>for specific use cases</em>. For example, 
                  <strong>AI coding of high-acuity ED visits can achieve ~98% accuracy</strong> in coding agreement. Likewise, a recent AHIMA panel 
                  noted <strong>autonomous coding maintains ~96% accuracy even at high volumes</strong>. These figures indicate that, under ideal conditions, 
                  AI can code even complex outpatient cases with very high precision. In practice, however, not all complex cases meet those "ideal" 
                  conditions – unusual or multi-faceted cases might stump the AI. Thus, the effective accuracy in real-world across all high-complexity 
                  charts is lower. Without human review, <strong>automation may miss subtle details</strong> (studies have found CAC tools struggle with 
                  complex chronic conditions, needing coder intervention). In summary, <strong>automated coding <em>can</em> be ~95%+ accurate for 
                  high-complexity charts, but only for the subset it can confidently handle; human coders are still crucial to ensure near-100% 
                  accuracy on these challenging cases.</strong>
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">$/chart:</h4>
                <p className="text-sm leading-relaxed">
                  These charts are more expensive to code than routine visits. An ED Level 5 or lengthy specialty visit requires more coder time, 
                  translating to higher per-chart fees. On coding marketplaces, <strong>the highest complexity outpatient cases can pay up to ~$30 per chart</strong>. 
                  For example, a critical care encounter might cost on the order of <strong>$10 or more</strong> to code. Outsourcing companies often 
                  build this into their rates – e.g. they might charge, say, $8–$12 for a complex ED visit versus a few dollars for a simple one 
                  (some anecdotal reports suggest ~$5–$8 for moderate ED, and higher for critical care). Overall, <strong>expect high-complexity outpatient 
                  professional charts to cost in the upper single-digits to low double-digits ($) each</strong> for coding. This reflects the extra work: 
                  coding multiple procedures, lengthy documentation, and ensuring all critical details (like time-based critical care billing) are captured.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3b */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                3b. Outpatient – High Complexity (Facility Billing)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">% Covered:</h4>
                <p className="text-sm leading-relaxed">
                  This category includes facility-side coding for complex outpatient cases – e.g. <strong>ED facility claims for trauma/critical cases, 
                  complex infusion center visits, high-cost imaging in emergencies.</strong> These are relatively infrequent but resource-intensive encounters. 
                  For context, out of ~155 million ED visits, about <strong>17.8 million (11.5%) result in hospital admission</strong> (i.e. very severe) 
                  and ~3.1 million require ICU care – those give a sense of "upper-end" outpatient emergencies volume. So high-complexity outpatient 
                  facility cases likely constitute on the order of <strong>10% or less of outpatient facility encounters</strong>. They are the outliers 
                  in complexity (trauma cases, etc.), but every hospital handles a share of them (e.g. level 1 trauma centers see many). Overall, 
                  a <strong>small minority of outpatient facility charts, but important due to their complexity and revenue impact.</strong>
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Automation %:</h4>
                <p className="text-sm leading-relaxed">
                  Facility coding for complex outpatient cases has <strong>some automation in limited areas.</strong> Notably, <strong>many hospitals employ 
                  automated algorithms for ED facility level assignment</strong> – the EHR can <strong>"automatically calculate the ED E/M level as services 
                  are documented"</strong> based on a point system. This means even for high-acuity ED visits, the facility E/M code is often generated 
                  by software (with later review). Other pieces (e.g. pharmacy charges for infusions) are pulled from systems automatically. However, 
                  <em>comprehensive</em> coding still needs manual work: assigning detailed ICD-10 diagnoses, ensuring procedures are captured, and 
                  validating the auto-generated levels. So, automation might cover <strong>certain subsets (perhaps 30–40% of coding inputs)</strong> – 
                  for example, the ED level and routine charges might be auto-populated – but <strong>final coding of complex cases remains heavily 
                  coder-dependent.</strong> End-to-end "autonomous" facility coding for a trauma ED visit is not yet a reality in most places. Given the 
                  stakes (high-dollar claims), hospitals are cautious – <strong>CAC assists but humans lead</strong> for these charts.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Accuracy %:</h4>
                <p className="text-sm leading-relaxed">
                  With the hybrid of algorithms and human coding, accuracy for complex outpatient facility claims is kept high – typically 
                  <strong>~95-99% of codes correct</strong> after review. The <strong>automated portions (like ED level assignment) generally follow 
                  well-defined criteria, yielding consistent results</strong> (improving compliance). Any errors usually come from documentation gaps 
                  rather than pure coding mistakes. As a result, health systems often report <strong>99% clean claim rates</strong> for facility coding 
                  when robust processes are in place. That said, achieving this requires that <strong>coders verify the automated outputs</strong>. 
                  If one were to let an AI/coder system fully autonomously code a complex case, accuracy would likely drop – as noted, current NLP 
                  struggles with the complexity of inpatient-like documentation even in an ED setting. In practice though, <strong>facility coding for 
                  high-complex cases undergoes rigorous human QA, resulting in very high final accuracy (≈98–99%).</strong>
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">$/chart:</h4>
                <p className="text-sm leading-relaxed">
                  These are among the <strong>most expensive outpatient charts to code</strong>, given their complexity. An extensive ED trauma visit 
                  or a multi-hour infusion encounter can take significant coder time. Outsourced coding vendors may charge <strong>in the range of 
                  $10–$20+ per chart</strong> for such cases. For example, coding a complex ED facility case (multiple procedures, critical care, etc.) 
                  might be in the mid-teens of dollars. Indeed, one outsourcing firm's coders were paid <strong>$13.50 per chart for very long-stay 
                  inpatient/ED cases</strong> – implying the company bills a higher rate (likely ~$20 or more). Thus, for high-complexity outpatient 
                  facility encounters, <strong>cost-per-chart typically falls in the tens of dollars</strong> (often mid-teens), commensurate with the 
                  detail involved. This is markedly higher than routine outpatient charts, reflecting the extra work and expertise needed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 4a */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                4a. Inpatient – Professional (Physician Services in Hospital)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">% Covered:</h4>
                <p className="text-sm leading-relaxed">
                  These are physician E/M services for hospitalized patients (daily rounding notes, consults, discharge summaries, etc.). 
                  In the U.S., there are roughly <strong>33 million inpatient admissions per year</strong>, each generating multiple professional 
                  service records (initial visit, subsequent days, procedures). Virtually every inpatient has associated physician charts to code. 
                  So the volume is large – <em>hundreds of millions</em> of inpatient professional service codes annually (e.g. a typical 5-day stay 
                  might have 5–7 billable encounters per physician). However, <strong>many hospitals do not centrally code these – they are often 
                  coded/billed by physician groups themselves.</strong> In terms of market volume, inpatient professional coding is substantial but 
                  diffuse (hospitalists, specialists, etc., each submitting their own bills). It's a ubiquitous category but typically 
                  <strong>managed separately from facility coding.</strong>
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Automation %:</h4>
                <p className="text-sm leading-relaxed">
                  Automation here is <strong>limited</strong>. Unlike outpatient, there has not been as much deployment of CAC for inpatient professional 
                  E/M coding. Physicians often select their own visit levels (using EHR prompts) or employ coding staff in their practice to do so. 
                  Some CAC solutions can assist by reading inpatient notes to suggest codes, but <strong>fully automated coding of inpatient professional 
                  services is not standard</strong>. Current AI efforts have focused on outpatient due to shorter records. So, industry-wide, 
                  <strong>the percentage of inpatient professional coding tasks automated is very low – likely under 10% fully automated.</strong> That said, 
                  EHRs have some built-in automation (e.g. capture of procedures via order entry). For evaluation and management notes, though, human 
                  judgment is still paramount. We are seeing early signs of automation (e.g. ambient documentation tools that also propose codes), 
                  but for now <strong>inpatient pro coding is overwhelmingly done by human coders or the providers themselves, with CAC only as a 
                  supplemental tool.</strong>
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Accuracy %:</h4>
                <p className="text-sm leading-relaxed">
                  Since automation is rare, reported "accuracy" specifically for automated inpatient pro coding is hard to come by. One can infer 
                  that <strong>human coders achieve ~95-98% accuracy</strong> on inpatient E/M assignment when audited (similar to other domains). 
                  CAC when applied can help consistency, but on complex inpatient notes it may miss context – <strong>NLP accuracy drops with complex 
                  narratives</strong>. One study noted that without human review, CAC suggestions in complex cases led to increased errors. Thus, 
                  we might say <strong>automation alone isn't yet reliable enough to quote a high accuracy for this category</strong> – instead, 
                  the <strong>best practice is human-driven coding with CAC QA, yielding the usual ~95%+ agreement with documentation</strong>. 
                  It's expected that as autonomous coding tools evolve, they'll target this area, but currently accuracy metrics (like F1 scores) 
                  for inpatient pro coding by AI are not prominently published, reflecting the early stage of automation here.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">$/chart:</h4>
                <p className="text-sm leading-relaxed">
                  The cost to code inpatient professional services can vary. If billing is done by physician groups, they incur their own coding 
                  costs (often internal). For hospitals that outsource this (e.g. coding all physician notes for employed hospitalists), the fees 
                  are typically <strong>a few dollars per encounter</strong>. For instance, coding a single inpatient consult note might be ~$3. 
                  If charged per admission's worth of pro-fee coding, it could be ~$10 (for multiple notes). Platforms like KODE quote 
                  <strong>$1–$30 range per record depending on complexity</strong>, so a standard inpatient daily note likely falls on the 
                  lower-middle end (a few dollars). Overall, <strong>inpatient pro coding is less labor-intensive than facility coding for the 
                  whole stay, so per-chart costs tend to be lower</strong> – but keep in mind an admission generates multiple charts. If a vendor 
                  charged, say, $5 per physician encounter and an average admission had 5 encounters, that's $25 per patient in total. In practice, 
                  costs are managed by either bundling into salaries (for in-house coders) or modest per-chart fees externally.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 4b */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">
                4b. Inpatient – Facility (Hospital Facility Coding for Admissions)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg mb-2">% Covered:</h4>
                <p className="text-sm leading-relaxed">
                  This is the coding of the entire inpatient stay (diagnoses, procedures, DRG assignment, etc.). Every hospital admission 
                  (≈33 million annually in the U.S.) requires facility coding. This is a core function of hospital HIM departments. So 
                  <strong>100% of inpatient stays</strong> must be coded, and each is typically high complexity (multiple diagnoses, surgeries, etc.). 
                  Inpatient facility charts represent a smaller count than outpatient visits, but they account for the <em>majority of coding workload 
                  by complexity</em> (and drive major reimbursement like DRGs). Essentially, this category covers <strong>all hospital inpatients – 
                  the volume is all admissions – which, while "only" ~33 million records/year, is critical from a revenue standpoint.</strong>
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Automation %:</h4>
                <p className="text-sm leading-relaxed">
                  Fully automating inpatient facility coding remains <strong>more aspirational than reality in 2025</strong>. CAC tools are heavily 
                  used to assist human coders – by scanning charts and suggesting ICD-10 codes – but <strong>complete "autonomous" coding for inpatient 
                  stays is not widely achieved yet</strong>. Industry experts propose frameworks for future autonomous inpatient coding, acknowledging 
                  the <strong>complexity and variability of hospital documentation</strong> is a limiting factor. At present, <strong>nearly all hospitals 
                  use human coders (often aided by CAC software) to code inpatient records.</strong> The <strong>automation is partial:</strong> the grouper 
                  will automatically compute the DRG once codes are entered, and CAC may auto-pick some obvious codes, but a coder must validate and 
                  select from suggestions. It's estimated that <strong>0% of hospitals have fully driverless inpatient coding</strong> – <em>all</em> have 
                  human in the loop. Perhaps one could say <strong>20–30% of the coding effort might be handled by software suggestions</strong>, with the 
                  coder doing the rest. But ultimately, <strong>inpatient facility coding is still reliant on human coders for final code assignment.</strong>
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">Accuracy %:</h4>
                <p className="text-sm leading-relaxed">
                  With current practices, hospitals typically maintain high accuracy through robust human QA – <strong>often 95–98% coding accuracy 
                  for inpatient facility claims</strong> is reported (auditors check a sample and find very few errors). CAC by itself has a tougher time: 
                  as an AHIMA article notes, <strong>inpatient documentation's complexity can "significantly challenge" NLP/AI extraction of correct codes</strong>. 
                  Thus pure automation accuracy is not published for this category (it's not fully operational yet). Instead, <strong>blended human+CAC 
                  processes achieve high accuracy</strong>. Many hospitals have internal targets like <strong>95% "code-over-code" agreement</strong> between 
                  coder and auditor. Vendors sometimes claim their coding services (with dual review) hit <strong>99% accuracy</strong>. In summary, 
                  <strong>the accuracy for final inpatient coding is very high when done with careful human oversight (≈95–99%)</strong>, whereas an 
                  unassisted AI would currently not reach that for a full inpatient stay. The focus is on using technology to support coders (ensuring 
                  no diagnosis is missed), thereby <em>improving</em> accuracy – e.g. CDI tools can boost capture of complications by 20–30% which 
                  indirectly raises coding accuracy/completeness.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">$/chart:</h4>
                <p className="text-sm leading-relaxed">
                  Inpatient facility charts are <strong>the most expensive to code</strong> on a per-record basis. They require significant coder time 
                  and expertise. Outsourced coding rates for inpatient cases are often quoted in the <strong>$20–$30+ per chart</strong> range. 
                  For example, one remote coding employer was paying <strong>$13.50 per inpatient chart to the coder</strong> – implying the client 
                  might be billed around $20 (after the vendor's overhead/profit). KODE's range up to $30 suggests very complex admissions can reach 
                  that cost. These figures align with anecdotal norms: an average inpatient record might be ~$25 to code, with higher for extremely 
                  lengthy stays. It's worth noting the <strong>cost per inpatient chart is an order of magnitude higher than a simple outpatient chart</strong>, 
                  due to complexity. However, on a per-diem basis it's still efficient (a $25 coding cost for a hospitalization that might generate 
                  tens of thousands of dollars in charges). Some large hospitals handle this in-house to manage costs, but for outsourced scenarios, 
                  <strong>expect $20± per record as a typical price</strong> for full inpatient facility coding.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-muted-foreground">Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <strong>Sources:</strong> The data above is drawn from recent U.S. statistics and industry reports, including CDC/AHA utilization 
                figures, vendor case studies (e.g. 3M, CodaMetrix, Nym, etc.) for automation rates, AHIMA and academic publications on CAC accuracy, 
                and RCM outsourcing testimonials for cost/pricing benchmarks. All information is specific to the US healthcare system in the past 
                ~2 years and reflects a composite of sources for a balanced market overview.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}