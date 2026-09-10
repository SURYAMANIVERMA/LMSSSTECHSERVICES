export const LMS_URL = "https://lms.sstechservices.org/";

export const SITE = {
  name: "SS TECH SERVICES",
  short: "SS TECH",
  phone: "+91 8808227885",
  phoneRaw: "+918808227885",
  whatsapp: "918808227885",
  emails: ["surya@sstechservices.org", "info@sstechservices.org"],
  address:
    "Knovatik Co-Working Space, Levana Cyber Heights, Vijaipur Colony, Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010, India",
  tagline: "BUILD • SECURE • SUPPORT • GROW",
};

export const NAV: { to: string; label: string; external?: boolean }[] = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/lms/courses", label: "Training Academy" },
  { to: "/lms", label: "My Learning" },
  { to: "/projects", label: "Student Projects" },
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
  { title: "Network Installation", desc: "End-to-end LAN/WAN design, deployment & optimization for enterprise networks.", icon: "Network", detail: "Site survey, IP schema design, switching/routing rollout, VLAN & QoS tuning, wireless coverage planning and post-go-live optimisation for multi-floor and multi-branch offices.", manpower: ["L2 Network Engineer (CCNA) on-site", "Senior Network Architect for design sign-off", "Cabling technicians for patching & labelling", "Handover documentation + as-built diagrams"] },
  { title: "Structured Cabling", desc: "Cat6/Cat6A, fiber backbones, certified termination & dressing for data centers.", icon: "Cable", detail: "Passive infrastructure built to TIA/EIA standards — cable trays, racks, patch panels, fiber backbones, Fluke certification reports and colour-coded dressing for clean rack aesthetics.", manpower: ["Cabling supervisor + technician crew", "Fluke certification engineer", "Rack & LIU installation team", "Test reports for every port"] },
  { title: "Server Installation", desc: "Rack, stack, configure — Dell, HPE, Lenovo. OS, RAID & bare-metal provisioning.", icon: "Server", detail: "Physical rack & stack, iDRAC/iLO setup, RAID and firmware baselining, OS provisioning, clustering, backup jobs and performance validation before production cutover.", manpower: ["Datacenter hardware engineer", "L3 Server administrator", "Backup & DR specialist", "Commissioning checklist sign-off"] },
  { title: "Linux Administration", desc: "RHEL, Ubuntu, CentOS — patching, hardening, automation with Ansible.", icon: "Terminal", detail: "Day-2 Linux operations: patch cycles, CIS hardening, user & sudo governance, shell/Ansible automation, capacity monitoring and root-cause analysis with SLA-backed response.", manpower: ["RHCSA/RHCE certified administrator", "Automation engineer (Ansible)", "24x7 L1 monitoring shift cover", "Monthly patch & audit report"] },
  { title: "OpenShift Support", desc: "OCP cluster install, upgrades, operator lifecycle & 24x7 production support.", icon: "Container", detail: "OpenShift/Kubernetes platform engineering — cluster install, etcd & node health, operator lifecycle, CI/CD onboarding, ingress and storage integration, upgrade runbooks.", manpower: ["OpenShift platform engineer", "DevOps/CI-CD engineer", "Escalation architect on retainer", "Upgrade & rollback runbooks"] },
  { title: "Cloud Solutions", desc: "AWS, Azure, GCP architecture, migration, FinOps and managed cloud services.", icon: "Cloud", detail: "Landing-zone design, lift-and-shift or re-platform migration, IaC with Terraform, cost optimisation, backup/DR and fully managed cloud operations.", manpower: ["Cloud architect (AWS/Azure/GCP)", "Migration & Terraform engineer", "FinOps analyst for cost reviews", "Managed cloud ops team"] },
  { title: "CCTV Surveillance", desc: "IP CCTV design, NVR/DVR, edge AI cameras with remote monitoring dashboards.", icon: "Camera", detail: "Camera placement design, PoE switching, NVR/VMS configuration, edge AI analytics, retention planning and secure remote viewing on mobile and web dashboards.", manpower: ["Security systems engineer", "Installation & alignment technicians", "VMS configuration specialist", "Remote view setup + user training"] },
  { title: "Monitoring & SOC", desc: "Wazuh, Splunk, Zabbix, Grafana — observability + 24x7 SOC operations.", icon: "Activity", detail: "SIEM and observability build-out — log onboarding, detection rules, dashboards, alert routing and 24x7 SOC triage with incident escalation matrices.", manpower: ["SOC Analyst L1/L2 (24x7 rota)", "SIEM engineer (Wazuh/Splunk)", "Threat-hunting lead", "Monthly incident & KPI reporting"] },
  { title: "IT Manpower", desc: "On-demand engineers — L1/L2/L3 support, project & contract staffing.", icon: "Users", detail: "Vetted, background-checked engineers deployed on-site or remote — per-day, per-project or long-term contract, with a bench for instant replacement.", manpower: ["L1 Helpdesk / desktop support", "L2 Network & server engineers", "L3 specialists & architects", "Replacement bench + attendance SLA"] },
];


export const SOLUTION_AREAS = [
  "IT Infrastructure",
  "Network & Security",
  "Server Administration",
  "Cloud Solutions",
  "Cyber Security",
  "OpenShift / Kubernetes",
  "Linux & Windows Server",
  "IT Support & Helpdesk",
  "AMC & Managed Services",
  "CCTV & Security Solutions",
  "Networking & Cabling",
  "Enterprise IT Solutions",
  "Software & Hardware Solutions",
  "Corporate IT Support",
];

export const TESTIMONIALS = [
  { name: "Aarav Sharma", role: "IT Head, BFSI Client", text: "SS TECH SERVICES built and now runs our 24x7 SOC. Detection quality and response times improved dramatically." },
  { name: "Priya Verma", role: "CTO, EdTech Company", text: "Our multi-region AWS migration was delivered on schedule with zero unplanned downtime. Excellent cloud engineering." },
  { name: "Mohammed Aman", role: "Infra Manager, Healthcare Group", text: "Production OpenShift cluster, GitOps and DR readiness — handled end-to-end by engineers who run these in production." },
  { name: "Ananya Singh", role: "Admin Head, Corporate Office", text: "Their AMC and quick support keep 200+ devices running. On-site engineers reach us within the hour." },
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

export type Project = {
  slug: string;
  title: string;
  client: string;
  tech: string;
  desc: string;
  category: string;
  year: string;
  requirements: string[];
  stack: string[];
  outcomes: string[];
};

export const PROJECT_CATEGORIES = [
  "All",
  "Cyber Security",
  "Cloud & DevOps",
  "Full Stack",
  "Data & AI",
  "Networking & Linux",
  "Mobile Apps",
];

export const PROJECTS: Project[] = [
  {
    slug: "soc-home-lab-capstone",
    title: "SOC Home Lab Capstone",
    client: "Cyber Security Batch",
    tech: "Wazuh • ELK • Sysmon",
    desc: "Students build a full detection lab, onboard logs and write MITRE-mapped alert rules.",
    category: "Cyber Security",
    year: "2026",
    requirements: [
      "Build a monitored lab with attacker and victim machines",
      "Onboard Windows and Linux logs into a SIEM",
      "Detect and document 10 real attack techniques",
    ],
    stack: ["Wazuh", "ELK Stack", "Sysmon", "Kali Linux", "Atomic Red Team"],
    outcomes: [
      "Each student ships a detection portfolio with 10 use cases",
      "Interview-ready incident report and lab documentation",
      "Direct mapping to SOC Analyst L1 interview questions",
    ],
  },
  {
    slug: "web-app-pentest-report",
    title: "Web App Pentest Report",
    client: "Ethical Hacking Batch",
    tech: "Burp Suite • OWASP Top 10",
    desc: "End-to-end vulnerability assessment of a deliberately insecure app with a client-grade report.",
    category: "Cyber Security",
    year: "2026",
    requirements: [
      "Test a target app against the OWASP Top 10",
      "Prove impact with safe exploitation evidence",
      "Deliver a professional VAPT report with CVSS scores",
    ],
    stack: ["Burp Suite", "OWASP ZAP", "Nmap", "SQLMap", "DVWA / Juice Shop"],
    outcomes: [
      "20+ findings documented with remediation guidance",
      "Report template students reuse in real audits",
      "Mentor review round before final submission",
    ],
  },
  {
    slug: "ci-cd-pipeline-on-aws",
    title: "CI/CD Pipeline on AWS",
    client: "Cloud & DevOps Batch",
    tech: "Jenkins • Docker • Terraform",
    desc: "Automated build, test and deploy pipeline provisioning infrastructure as code.",
    category: "Cloud & DevOps",
    year: "2026",
    requirements: [
      "Zero-touch deployment from Git commit to production",
      "Reproducible infrastructure with Terraform",
      "Rollback and monitoring built in",
    ],
    stack: ["Jenkins", "GitHub Actions", "Docker", "Terraform", "AWS EC2 / S3"],
    outcomes: [
      "Deployment time reduced from manual hours to 4 minutes",
      "Students demo a live public URL in interviews",
      "Covers 80% of DevOps fresher interview scope",
    ],
  },
  {
    slug: "kubernetes-microservices",
    title: "Kubernetes Microservices Platform",
    client: "DevOps Advanced Batch",
    tech: "Kubernetes • Helm • Prometheus",
    desc: "Multi-service app deployed on Kubernetes with autoscaling, ingress and observability.",
    category: "Cloud & DevOps",
    year: "2026",
    requirements: [
      "Split a monolith into three containerised services",
      "Autoscale under load and survive pod failure",
      "Dashboards and alerts for every service",
    ],
    stack: ["Kubernetes", "Helm", "Prometheus", "Grafana", "NGINX Ingress"],
    outcomes: [
      "Self-healing cluster demo with load test results",
      "Helm charts published to the student's GitHub",
      "Observability stack reused in later modules",
    ],
  },
  {
    slug: "lms-style-mern-portal",
    title: "Learning Portal (MERN)",
    client: "Full Stack Batch",
    tech: "React • Node • MongoDB",
    desc: "Students build a course portal with auth, enrolment, progress tracking and payments.",
    category: "Full Stack",
    year: "2026",
    requirements: [
      "Role-based login for student, trainer and admin",
      "Course, lesson and progress data models",
      "Online payment and invoice flow",
    ],
    stack: ["React", "Node.js", "Express", "MongoDB", "Razorpay"],
    outcomes: [
      "Production-style portfolio project, deployed live",
      "Covers REST APIs, auth, roles and payments",
      "Code reviewed module by module by mentors",
    ],
  },
  {
    slug: "python-data-dashboard",
    title: "Sales Analytics Dashboard",
    client: "Data Analytics Batch",
    tech: "Python • Pandas • Power BI",
    desc: "Cleaning, modelling and visualising a messy real-world dataset into a decision dashboard.",
    category: "Data & AI",
    year: "2026",
    requirements: [
      "Clean and join 3 raw data sources",
      "Build KPIs for revenue, churn and region",
      "Publish an interactive dashboard",
    ],
    stack: ["Python", "Pandas", "SQL", "Power BI", "Excel"],
    outcomes: [
      "Portfolio dashboard with documented insights",
      "SQL + Pandas interview drill sheet",
      "Case-study walkthrough recorded by the student",
    ],
  },
  {
    slug: "ml-churn-prediction",
    title: "Customer Churn Prediction",
    client: "AI / ML Batch",
    tech: "scikit-learn • Streamlit",
    desc: "Full ML lifecycle — features, training, evaluation and a deployed prediction app.",
    category: "Data & AI",
    year: "2026",
    requirements: [
      "Beat a baseline model on recall",
      "Explain predictions to a business stakeholder",
      "Deploy the model behind a simple UI",
    ],
    stack: ["Python", "scikit-learn", "SHAP", "Streamlit", "Docker"],
    outcomes: [
      "Deployed app link plus model card in the portfolio",
      "Hands-on with imbalanced data and explainability",
      "Mentor-graded evaluation report",
    ],
  },
  {
    slug: "enterprise-lan-lab",
    title: "Enterprise LAN & Linux Lab",
    client: "Networking & Linux Batch",
    tech: "Cisco • RHEL • Ansible",
    desc: "Design a multi-VLAN campus network and automate Linux server hardening.",
    category: "Networking & Linux",
    year: "2026",
    requirements: [
      "VLAN, routing and DHCP design for 3 floors",
      "Harden RHEL servers to CIS baseline",
      "Automate repeat tasks with Ansible",
    ],
    stack: ["Cisco Packet Tracer", "GNS3", "RHEL", "Ansible", "Bash"],
    outcomes: [
      "As-built network diagram and config backups",
      "Ansible playbooks for patching and hardening",
      "Prepares directly for CCNA and RHCSA labs",
    ],
  },
  {
    slug: "android-attendance-app",
    title: "Attendance App (Android)",
    client: "Android Development Batch",
    tech: "Kotlin • Jetpack Compose",
    desc: "Native Android app with login, camera check-in, offline cache and cloud sync.",
    category: "Mobile Apps",
    year: "2026",
    requirements: [
      "Face/QR based check-in with location stamp",
      "Work offline and sync when back online",
      "Admin view for daily attendance reports",
    ],
    stack: ["Kotlin", "Jetpack Compose", "Room", "Retrofit", "Firebase"],
    outcomes: [
      "Signed APK published for portfolio review",
      "Covers the full Android interview syllabus",
      "Play Store submission walkthrough included",
    ],
  },
];

export type Opening = {
  slug: string;
  title: string;
  loc: string;
  type: string;
  dept: string;
  exp: string;
  desc: string;
  skills: string[];
};

export const OPENINGS: Opening[] = [
  {
    slug: "senior-cyber-security-trainer",
    title: "Senior Cyber Security Trainer",
    loc: "Lucknow",
    type: "Full-time",
    dept: "Training Academy",
    exp: "4+ years",
    desc: "Deliver SOC Analyst, Ethical Hacking and Wazuh/Splunk programmes with hands-on lab sessions.",
    skills: ["SOC operations", "Wazuh / Splunk", "MITRE ATT&CK", "Classroom delivery"],
  },
  {
    slug: "devops-engineer-trainer",
    title: "DevOps Engineer (Trainer + Practitioner)",
    loc: "Lucknow / Hybrid",
    type: "Full-time",
    dept: "Cloud & DevOps",
    exp: "3+ years",
    desc: "Split your week between client CI/CD delivery and mentoring DevOps batches.",
    skills: ["Kubernetes", "Docker", "Terraform", "GitHub Actions / Jenkins"],
  },
  {
    slug: "linux-rhce-trainer",
    title: "Linux & RHCE Trainer",
    loc: "Lucknow",
    type: "Full-time",
    dept: "Training Academy",
    exp: "3+ years",
    desc: "Own the RHCSA and RHCE tracks end to end, from lab design to certification readiness.",
    skills: ["RHEL", "Ansible", "Shell scripting", "RHCE certified preferred"],
  },
  {
    slug: "full-stack-developer-mern",
    title: "Full Stack Developer (MERN)",
    loc: "Remote / Lucknow",
    type: "Full-time",
    dept: "Software Delivery",
    exp: "2+ years",
    desc: "Build client web platforms and internal LMS features with React, Node and Postgres.",
    skills: ["React + TypeScript", "Node.js", "PostgreSQL", "REST APIs"],
  },
  {
    slug: "network-engineer-l2",
    title: "Network Engineer (L2)",
    loc: "Lucknow",
    type: "Full-time",
    dept: "IT Infrastructure",
    exp: "2+ years",
    desc: "Deploy and support enterprise LAN/WAN, firewalls and structured cabling projects.",
    skills: ["Routing & switching", "CCNA", "Firewalls", "Structured cabling"],
  },
  {
    slug: "business-development-executive",
    title: "Business Development Executive",
    loc: "Lucknow",
    type: "Full-time",
    dept: "Sales",
    exp: "1+ years",
    desc: "Drive enterprise IT services and academy admissions across Uttar Pradesh.",
    skills: ["B2B sales", "Client presentations", "CRM hygiene", "Hindi + English"],
  },
  {
    slug: "it-support-intern",
    title: "IT Support Intern",
    loc: "Lucknow",
    type: "Internship",
    dept: "IT Infrastructure",
    exp: "Fresher",
    desc: "Learn on live client tickets — desktop, network and CCTV support with mentorship.",
    skills: ["Windows / Linux basics", "Networking basics", "Willingness to learn"],
  },
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
export const TRAINING_TRACKS = [
  "Cyber Security",
  "Ethical Hacking",
  "Cloud Computing (AWS / Azure)",
  "DevOps & Kubernetes",
  "Full Stack Development",
  "Python & Data Analytics",
  "AI / Machine Learning",
  "Networking (CCNA)",
  "Linux (RHCSA)",
  "Android Development",
  "Internship Program",
  "Placement Assistance",
];
