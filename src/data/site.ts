export const SITE = {
  name: "SS TECH SERVICES & ACADEMY",
  short: "SS TECH",
  phone: "+91 8808227885",
  phoneRaw: "+918808227885",
  whatsapp: "918808227885",
  emails: ["surya@sstechservices.org", "info@sstechservices.org"],
  address:
    "Knovatik Co-Working Space, Levana Cyber Heights, Vijaipur Colony, Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010, India",
  tagline: "LEARN • BUILD • SECURE • GROW",
};

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "IT Services" },
  { to: "/quick-support", label: "Quick Support" },
  { to: "/academy", label: "Training Academy" },
  { to: "/lms", label: "LMS Portal" },
  { to: "/internship", label: "Internship" },
  { to: "/placement", label: "Placement" },
  { to: "/projects", label: "Projects" },
  { to: "/careers", label: "Careers" },
  { to: "/contact", label: "Contact" },
];

export const TICKET_STATUS_META: Record<string, { label: string; color: string; step: number }> = {
  new:         { label: "New",          color: "bg-blue-500",    step: 1 },
  assigned:    { label: "Assigned",     color: "bg-purple-500",  step: 2 },
  in_progress: { label: "In Progress",  color: "bg-amber-500",   step: 3 },
  resolved:    { label: "Resolved",     color: "bg-emerald-500", step: 4 },
  closed:      { label: "Closed",       color: "bg-slate-500",   step: 4 },
};

export const IT_SERVICES = [
  { title: "Network Installation", desc: "End-to-end LAN/WAN design, deployment & optimization for enterprise networks.", icon: "Network" },
  { title: "Structured Cabling", desc: "Cat6/Cat6A, fiber backbones, certified termination & dressing for data centers.", icon: "Cable" },
  { title: "Server Installation", desc: "Rack, stack, configure — Dell, HPE, Lenovo. OS, RAID & bare-metal provisioning.", icon: "Server" },
  { title: "Linux Administration", desc: "RHEL, Ubuntu, CentOS — patching, hardening, automation with Ansible.", icon: "Terminal" },
  { title: "OpenShift Support", desc: "OCP cluster install, upgrades, operator lifecycle & 24x7 production support.", icon: "Container" },
  { title: "Cloud Solutions", desc: "AWS, Azure, GCP architecture, migration, FinOps and managed cloud services.", icon: "Cloud" },
  { title: "CCTV Surveillance", desc: "IP CCTV design, NVR/DVR, edge AI cameras with remote monitoring dashboards.", icon: "Camera" },
  { title: "Monitoring & SOC", desc: "Wazuh, Splunk, Zabbix, Grafana — observability + 24x7 SOC operations.", icon: "Activity" },
  { title: "IT Manpower", desc: "On-demand engineers — L1/L2/L3 support, project & contract staffing.", icon: "Users" },
];

export const COURSE_CATEGORIES = [
  {
    name: "Cyber Security & SOC",
    color: "from-red-600 to-rose-500",
    courses: ["Cyber Security", "Ethical Hacking", "SOC Analyst", "Wazuh", "Splunk"],
  },
  {
    name: "Networking & Hardware",
    color: "from-blue-700 to-sky-500",
    courses: ["Hardware & Networking", "CCNA"],
  },
  {
    name: "Linux & Open Source",
    color: "from-slate-900 to-slate-700",
    courses: ["Linux", "RHCSA", "RHCE"],
  },
  {
    name: "Cloud & DevOps",
    color: "from-blue-800 to-indigo-500",
    courses: ["Docker", "Kubernetes", "OpenShift", "AWS", "Azure", "GCP", "DevOps"],
  },
  {
    name: "Programming",
    color: "from-indigo-700 to-blue-500",
    courses: ["Python", "Java", "Full Stack Development"],
  },
  {
    name: "Web & Software",
    color: "from-sky-700 to-cyan-500",
    courses: ["Web Designing", "Web Development", "Software Development"],
  },
  {
    name: "Mobile Development",
    color: "from-rose-700 to-red-500",
    courses: ["Mobile App Development", "Android", "Flutter"],
  },
  {
    name: "Data & AI",
    color: "from-blue-900 to-blue-500",
    courses: ["Data Analytics", "Power BI", "AI", "Machine Learning"],
  },
  {
    name: "Career Readiness",
    color: "from-red-700 to-orange-500",
    courses: ["Resume Building", "Interview Preparation"],
  },
];

export const ALL_COURSES = COURSE_CATEGORIES.flatMap(c =>
  c.courses.map(course => ({ name: course, category: c.name }))
);

export const TESTIMONIALS = [
  { name: "Aarav Sharma", role: "SOC Analyst @ TCS", text: "The SOC + Wazuh program at SS TECH SERVICES & ACADEMY transformed my career. Real labs, real incidents, real placement." },
  { name: "Priya Verma", role: "Cloud Engineer @ Infosys", text: "From RHCSA to AWS — the structured roadmap and 24x7 lab access made all the difference. Placed within 45 days." },
  { name: "Mohammed Aman", role: "DevOps Engineer @ Wipro", text: "Hands-on Kubernetes & OpenShift training with mentors who actually run production clusters. Highly recommended." },
  { name: "Ananya Singh", role: "Full Stack Developer @ HCL", text: "The full-stack bootcamp pushed me to build 6 production-grade projects. Interview prep was top-notch." },
];

export const JOBS = [
  { title: "Junior SOC Analyst", company: "Confidential MNC", location: "Lucknow / Remote", type: "Full-time", exp: "0-1 yrs" },
  { title: "Linux System Engineer L1", company: "Leading IT Services", location: "Noida", type: "Full-time", exp: "0-2 yrs" },
  { title: "Network Support Engineer", company: "Telecom Major", location: "Lucknow", type: "Full-time", exp: "0-1 yrs" },
  { title: "DevOps Trainee", company: "Product Startup", location: "Bangalore", type: "Full-time", exp: "Fresher" },
  { title: "Cloud Support Associate (AWS)", company: "Cloud Partner", location: "Remote", type: "Full-time", exp: "0-2 yrs" },
  { title: "Frontend Developer (React)", company: "Digital Agency", location: "Lucknow", type: "Full-time", exp: "1-3 yrs" },
];

export const INTERNSHIPS = [
  { title: "Cyber Security Internship", duration: "3 Months", stipend: "₹5,000 – ₹10,000" },
  { title: "Full Stack Web Internship", duration: "6 Months", stipend: "₹8,000 – ₹15,000" },
  { title: "Cloud & DevOps Internship", duration: "3 Months", stipend: "₹6,000 – ₹12,000" },
  { title: "Data Analytics Internship", duration: "3 Months", stipend: "₹5,000 – ₹10,000" },
  { title: "Android / Flutter Internship", duration: "3 Months", stipend: "₹6,000 – ₹10,000" },
  { title: "Network & Linux Internship", duration: "2 Months", stipend: "₹4,000 – ₹8,000" },
];

export const PROJECTS = [
  { title: "Enterprise SOC Deployment", client: "BFSI Client", tech: "Wazuh • Splunk • ELK", desc: "24x7 SOC build-out with custom detection rules and SOAR integration." },
  { title: "Multi-Region AWS Migration", client: "EdTech Unicorn", tech: "AWS • Terraform • Kubernetes", desc: "Lift-and-shift + re-architecture of 80+ workloads across 3 AWS regions." },
  { title: "Data Center Cabling — 12 Racks", client: "Government PSU", tech: "Cat6A • OM4 Fiber", desc: "Certified structured cabling project completed in 21 days." },
  { title: "OpenShift Container Platform", client: "Healthcare Provider", tech: "OCP 4.x • GitOps", desc: "Production OCP cluster with ArgoCD, monitoring & DR readiness." },
  { title: "Campus-wide CCTV & Monitoring", client: "Educational Group", tech: "IP CCTV • Zabbix", desc: "300+ camera deployment with centralized NOC dashboard." },
  { title: "Cyber Range Lab", client: "Internal Academy", tech: "Proxmox • Kali • DVWA", desc: "Isolated red/blue team lab supporting 200 concurrent trainees." },
];

export const QUICK_SUPPORT_PLANS = [
  {
    name: "On-Call Visit (Lucknow)",
    price: "₹499",
    unit: "/ visit",
    eta: "Engineer at your doorstep within 60–90 mins inside Lucknow city.",
    features: [
      "PC / Laptop / Printer setup & repair",
      "WiFi router & network troubleshooting",
      "Virus removal & Windows reinstall",
      "CCTV / DVR on-site fix",
      "Free re-visit within 7 days for same issue",
    ],
    highlight: false,
  },
  {
    name: "Remote Support",
    price: "₹199",
    unit: "/ session",
    eta: "Connect in under 5 minutes via AnyDesk / TeamViewer. Pay only if resolved.",
    features: [
      "Software installation & activation",
      "Email, Outlook & MS Office issues",
      "Tally / GST / Busy software help",
      "Browser, antivirus & performance tuning",
      "Quick chat reply 9 AM – 11 PM",
    ],
    highlight: true,
  },
  {
    name: "Annual AMC (Business)",
    price: "₹4,999",
    unit: "/ year per device",
    eta: "Unlimited remote + 4 free on-site visits per year for SMBs in Lucknow.",
    features: [
      "Priority response (under 15 mins)",
      "Patch, backup & security monitoring",
      "Dedicated WhatsApp support line",
      "Quarterly health check-up report",
      "Discounted hardware procurement",
    ],
    highlight: false,
  },
];

export const QUICK_SUPPORT_ISSUES = [
  "Slow / hanging computer",
  "WiFi & internet not working",
  "Printer not printing",
  "Email setup (Gmail / Outlook)",
  "Windows reinstallation",
  "Virus / ransomware removal",
  "CCTV camera offline",
  "Tally / Busy / GST software",
  "Data recovery",
  "Office 365 / Zoom setup",
];