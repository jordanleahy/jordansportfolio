import { motion } from "framer-motion";

const companies = [
  { name: "SmarterDx", logo: "SD" },
  { name: "PrescriberPoint", logo: "PP" },
  { name: "BCG X", logo: "BCG" },
  { name: "Definitive Healthcare", logo: "DH" },
  { name: "RTD Health", logo: "RTD" },
  { name: "Pivot Design", logo: "PD" },
  { name: "Epic Systems", logo: "EPIC" }
];

const CompaniesSection = () => {
  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-3xl font-bold mb-4 text-foreground">Trusted by Leading Healthcare Companies</h2>
          <p className="font-sans text-muted-foreground text-lg">
            Delivering design excellence across the healthcare ecosystem
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="group"
            >
              <div className="bg-card border border-accent/20 rounded-lg p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 mx-auto mb-3 bg-accent/10 rounded-lg flex items-center justify-center text-accent font-bold text-sm">
                  {company.logo}
                </div>
                <p className="font-sans text-sm font-medium text-foreground/80 group-hover:text-accent transition-colors">
                  {company.name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompaniesSection;