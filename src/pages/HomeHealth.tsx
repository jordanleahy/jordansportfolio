import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, CheckCircle, XCircle, Users, Zap, TrendingUp } from "lucide-react";

const agencies = [
  { name: "Amedisys", approach: "Centralized In-House", tech: "Homecare Homebase, AlphaCollector", outsourced: false, partner: "Netsmart", notes: "51k hours saved via automation" },
  { name: "Enhabit", approach: "Centralized In-House", tech: "Homecare Homebase", outsourced: false, partner: "Inovalon (indirect)", notes: "Post-spinout consolidation" },
  { name: "Bayada", approach: "Centralized In-House", tech: "HCHB, Inovalon, Waystar", outsourced: false, partner: "Inovalon", notes: "98% clean-claim rate" },
  { name: "AccentCare", approach: "Outsourced", tech: "myUnity (Netsmart)", outsourced: true, partner: "Netsmart", notes: "Multi-year outsourced RCM deal" },
  { name: "Interim HealthCare", approach: "Decentralized In-House", tech: "Netsmart myUnity, Inovalon", outsourced: false, partner: "Franchise-based", notes: "Denials ↓ 75% with Inovalon" },
  { name: "Elara Caring", approach: "Centralized In-House", tech: "AlayaCare, ServiceNow, Forcura", outsourced: false, partner: "ServiceNow, WellSky", notes: "Emphasis on automation, APIs" },
  { name: "VNS Health", approach: "Centralized In-House", tech: "Legacy + Forcura", outsourced: false, partner: "Forcura", notes: "80% order signature in 30 days" },
  { name: "BayCare HomeCare", approach: "Integrated In-House", tech: "Epic", outsourced: false, partner: "—", notes: "Uses system Epic infrastructure" },
  { name: "UPMC Home Healthcare", approach: "Integrated In-House", tech: "Epic", outsourced: false, partner: "—", notes: "Uses UPMC Epic and RCM team" },
  { name: "CareTenders (Optum)", approach: "Centralized In-House", tech: "Proprietary + HCHB", outsourced: false, partner: "Optum", notes: "Likely migration to Optum tools" },
  { name: "Aveanna", approach: "Centralized In-House", tech: "HCHB → myUnity", outsourced: false, partner: "Netsmart", notes: "10-year Netsmart rollout" },
  { name: "Hartford HHC at Home", approach: "Integrated In-House", tech: "Epic", outsourced: false, partner: "—", notes: "Fully aligned with hospital RCM" },
  { name: "BrightSpring", approach: "Centralized In-House", tech: "Waystar, WellSky", outsourced: false, partner: "Waystar", notes: "Uses denial analytics, AI" },
  { name: "Mass General Brigham", approach: "Integrated In-House", tech: "Epic", outsourced: false, partner: "—", notes: "Epic-based, highly centralized" },
  { name: "Ascension at Home", approach: "Outsourced via JV", tech: "HCHB / myUnity", outsourced: true, partner: "Compassus, AccentCare", notes: "JV operators manage RCM" },
  { name: "VNA Care (MA)", approach: "Integrated In-House", tech: "HCHB → Epic", outsourced: false, partner: "MGB", notes: "Legacy HCHB → Epic migration" },
  { name: "VNA of WNY", approach: "Centralized In-House", tech: "Allscripts Homecare", outsourced: false, partner: "Kaleida Health", notes: "High intake integration" },
  { name: "Personal Touch", approach: "Centralized In-House", tech: "Hosted legacy EMR", outsourced: false, partner: "Crossroads Tech (infra)", notes: "Hit by ransomware; rebuilt internal ops" },
  { name: "MSA (Med. Svcs. of America)", approach: "Centralized In-House", tech: "Allscripts, WellSky", outsourced: false, partner: "WellSky", notes: "Used predictive analytics to ↓ re-hosp" },
  { name: "Catholic Home Care", approach: "Integrated In-House", tech: "Allscripts → Epic", outsourced: false, partner: "Catholic Health", notes: "Unified with hospital billing ops" }
];

const getApproachIcon = (approach: string) => {
  if (approach.includes("Integrated")) return <Building className="h-4 w-4" />;
  if (approach.includes("Centralized")) return <Users className="h-4 w-4" />;
  if (approach.includes("Outsourced")) return <Zap className="h-4 w-4" />;
  return <TrendingUp className="h-4 w-4" />;
};

const getApproachColor = (approach: string) => {
  if (approach.includes("Integrated")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  if (approach.includes("Centralized")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  if (approach.includes("Outsourced")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
  return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
};

export default function HomeHealth() {
  const totalAgencies = agencies.length;
  const outsourcedCount = agencies.filter(a => a.outsourced).length;
  const inHouseCount = totalAgencies - outsourcedCount;
  const epicCount = agencies.filter(a => a.tech.toLowerCase().includes('epic')).length;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Home Health RCM Landscape</h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive analysis of revenue cycle management approaches across major home health agencies
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalAgencies}</p>
                  <p className="text-sm text-muted-foreground">Total Agencies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{inHouseCount}</p>
                  <p className="text-sm text-muted-foreground">In-House RCM</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{outsourcedCount}</p>
                  <p className="text-sm text-muted-foreground">Outsourced</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{epicCount}</p>
                  <p className="text-sm text-muted-foreground">Using Epic</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agencies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {agencies.map((agency, index) => (
            <Card key={index} className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{agency.name}</CardTitle>
                  {agency.outsourced ? (
                    <XCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${getApproachColor(agency.approach)} w-fit`}
                >
                  <span className="flex items-center gap-1">
                    {getApproachIcon(agency.approach)}
                    {agency.approach}
                  </span>
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Core Technologies</p>
                  <p className="text-sm">{agency.tech}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Key Partner(s)</p>
                  <p className="text-sm">{agency.partner}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm text-muted-foreground">{agency.notes}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Insights */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Key Market Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">RCM Approach Distribution</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• {Math.round((inHouseCount / totalAgencies) * 100)}% manage RCM in-house</li>
                    <li>• {Math.round((outsourcedCount / totalAgencies) * 100)}% outsource RCM operations</li>
                    <li>• Epic integration common among hospital-affiliated agencies</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Technology Trends</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Netsmart and Epic dominate the platform landscape</li>
                    <li>• Automation driving significant efficiency gains</li>
                    <li>• API integration becoming standard practice</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}