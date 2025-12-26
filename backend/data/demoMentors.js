// Demo mentor profiles for demonstration purposes
// These profiles will be used to populate the browse section

// Helper function to get future dates for availability
const getFutureDates = () => {
  const today = new Date();
  const dates = [];
  
  // Get next 10 days (excluding weekends)
  let currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow
  
  while (dates.length < 10) {
    // Skip weekends
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

const futureDates = getFutureDates();

const demoMentors = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@demo.mentorverse.com",
    title: "Senior Software Engineer",
    company: "Google",
    bio: "I'm a passionate software engineer with 8+ years of experience at Google, specializing in full-stack development and cloud architecture. I love mentoring junior developers and helping them navigate their career growth. My expertise spans React, Node.js, Python, and Google Cloud Platform. I've led multiple high-impact projects and enjoy sharing knowledge about scalable system design and best coding practices.",
    experience: "Started as a junior developer at a startup, then joined Google where I've grown from SWE II to Senior SWE. Led the development of several user-facing features used by millions. Experienced in microservices architecture, distributed systems, and agile development methodologies.",
    expertise: ["JavaScript", "React", "Node.js", "Python", "Google Cloud", "System Design", "Microservices", "MongoDB"],
    linkedin: "https://linkedin.com/in/sarah-chen-demo",
    yearsOfExperience: 8,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    availability: {
      [futureDates[0]]: ["10:00 AM", "2:00 PM", "4:00 PM"],
      [futureDates[1]]: ["9:00 AM", "11:00 AM", "3:00 PM"],
      [futureDates[2]]: ["1:00 PM", "3:00 PM", "5:00 PM"],
      [futureDates[3]]: ["9:00 AM", "2:00 PM"],
      [futureDates[4]]: ["11:00 AM", "4:00 PM"]
    }
  },
  {
    name: "Marcus Johnson",
    email: "marcus.johnson@demo.mentorverse.com",
    title: "Product Manager",
    company: "Microsoft",
    bio: "Product management leader with 10+ years of experience building consumer and enterprise products at Microsoft. I specialize in product strategy, user research, and cross-functional team leadership. I'm passionate about helping aspiring PMs understand the role and develop the skills needed to succeed in product management.",
    experience: "Transitioned from engineering to product management 6 years ago. Led product initiatives for Microsoft Teams and Azure services. Expert in product roadmapping, stakeholder management, and data-driven decision making.",
    expertise: ["Product Management", "Product Strategy", "User Research", "Data Analysis", "Agile", "Stakeholder Management", "Azure", "Teams"],
    linkedin: "https://linkedin.com/in/marcus-johnson-demo",
    yearsOfExperience: 10,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    availability: {
      [futureDates[0]]: ["9:00 AM", "1:00 PM", "3:00 PM"],
      [futureDates[2]]: ["10:00 AM", "2:00 PM", "4:00 PM"],
      [futureDates[4]]: ["11:00 AM", "1:00 PM"],
      [futureDates[5]]: ["9:00 AM", "3:00 PM"],
      [futureDates[6]]: ["2:00 PM", "5:00 PM"]
    }
  },
  {
    name: "Dr. Priya Patel",
    email: "priya.patel@demo.mentorverse.com",
    title: "Data Science Manager",
    company: "Netflix",
    bio: "Data science leader with PhD in Machine Learning and 7+ years of industry experience. Currently managing a team of data scientists at Netflix, working on recommendation algorithms and content optimization. I'm passionate about making AI/ML accessible and helping others break into the data science field.",
    experience: "PhD in Machine Learning from Stanford, followed by roles at various tech companies. Specialized in recommendation systems, natural language processing, and computer vision. Published researcher with 15+ papers in top-tier conferences.",
    expertise: ["Machine Learning", "Python", "TensorFlow", "PyTorch", "Data Science", "Statistics", "Deep Learning", "NLP"],
    linkedin: "https://linkedin.com/in/priya-patel-demo",
    yearsOfExperience: 7,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
    availability: {
      [futureDates[1]]: ["2:00 PM", "4:00 PM"],
      [futureDates[3]]: ["10:00 AM", "12:00 PM", "3:00 PM"],
      [futureDates[5]]: ["9:00 AM", "11:00 AM"],
      [futureDates[7]]: ["1:00 PM", "4:00 PM"],
      [futureDates[8]]: ["10:00 AM", "2:00 PM"]
    }
  },
  {
    name: "Alex Rodriguez",
    email: "alex.rodriguez@demo.mentorverse.com",
    title: "UX Design Lead",
    company: "Airbnb",
    bio: "Creative UX designer with 9+ years of experience crafting user-centered digital experiences. Currently leading design for Airbnb's host platform. I'm passionate about design thinking, user research, and helping designers develop their craft and advance their careers in the design industry.",
    experience: "Started as a graphic designer, transitioned to UX/UI design. Worked at several startups before joining Airbnb. Led design for multiple product launches and redesigns. Expert in design systems, prototyping, and user testing methodologies.",
    expertise: ["UX Design", "UI Design", "Figma", "Sketch", "Design Systems", "User Research", "Prototyping", "Design Thinking"],
    linkedin: "https://linkedin.com/in/alex-rodriguez-demo",
    yearsOfExperience: 9,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    availability: {
      [futureDates[0]]: ["11:00 AM", "1:00 PM", "4:00 PM"],
      [futureDates[2]]: ["9:00 AM", "2:00 PM"],
      [futureDates[4]]: ["10:00 AM", "12:00 PM", "3:00 PM"],
      [futureDates[6]]: ["1:00 PM", "5:00 PM"],
      [futureDates[8]]: ["9:00 AM", "11:00 AM"]
    }
  },
  {
    name: "Jennifer Kim",
    email: "jennifer.kim@demo.mentorverse.com",
    title: "DevOps Engineer",
    company: "Amazon",
    bio: "DevOps and cloud infrastructure specialist with 6+ years of experience at Amazon Web Services. I help organizations scale their infrastructure and implement CI/CD best practices. Passionate about automation, monitoring, and helping developers understand the ops side of DevOps.",
    experience: "Started in system administration, evolved into DevOps engineering. Deep experience with AWS services, Kubernetes, and infrastructure as code. Led migration projects for enterprise clients and built scalable deployment pipelines.",
    expertise: ["AWS", "Kubernetes", "Docker", "Terraform", "Jenkins", "CI/CD", "Linux", "Monitoring"],
    linkedin: "https://linkedin.com/in/jennifer-kim-demo",
    yearsOfExperience: 6,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    availability: {
      [futureDates[1]]: ["1:00 PM", "3:00 PM", "5:00 PM"],
      [futureDates[3]]: ["9:00 AM", "11:00 AM", "2:00 PM"],
      [futureDates[5]]: ["10:00 AM", "1:00 PM", "4:00 PM"],
      [futureDates[7]]: ["9:00 AM", "3:00 PM"],
      [futureDates[9]]: ["11:00 AM", "2:00 PM"]
    }
  },
  {
    name: "David Thompson",
    email: "david.thompson@demo.mentorverse.com",
    title: "Startup Founder & CEO",
    company: "TechFlow Solutions",
    bio: "Serial entrepreneur with 12+ years of experience building and scaling startups. Founded three companies, with two successful exits. Currently CEO of TechFlow Solutions, a B2B SaaS company. I mentor aspiring entrepreneurs on product development, fundraising, and scaling teams.",
    experience: "Started first company right out of college. Learned through trial and error, eventually achieving successful exits. Expert in lean startup methodology, product-market fit, and venture capital fundraising. Raised over $50M across multiple rounds.",
    expertise: ["Entrepreneurship", "Startup Strategy", "Fundraising", "Product Development", "Team Building", "SaaS", "B2B Sales", "Leadership"],
    linkedin: "https://linkedin.com/in/david-thompson-demo",
    yearsOfExperience: 12,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    availability: {
      [futureDates[0]]: ["9:00 AM", "11:00 AM", "3:00 PM"],
      [futureDates[2]]: ["1:00 PM", "4:00 PM"],
      [futureDates[4]]: ["10:00 AM", "2:00 PM"],
      [futureDates[6]]: ["9:00 AM", "1:00 PM"],
      [futureDates[8]]: ["11:00 AM", "3:00 PM"]
    }
  },
  {
    name: "Lisa Wang",
    email: "lisa.wang@demo.mentorverse.com",
    title: "Mobile App Developer",
    company: "Spotify",
    bio: "Mobile development expert with 7+ years of experience building iOS and Android applications. Currently working on Spotify's mobile platform, focusing on performance optimization and user experience. I love helping developers master mobile development and stay current with the latest technologies.",
    experience: "Started with native iOS development, expanded to Android and cross-platform solutions. Worked on apps with millions of users. Expert in app store optimization, mobile performance, and user engagement strategies.",
    expertise: ["iOS Development", "Android Development", "Swift", "Kotlin", "React Native", "Flutter", "Mobile UI/UX", "App Store Optimization"],
    linkedin: "https://linkedin.com/in/lisa-wang-demo",
    yearsOfExperience: 7,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    availability: {
      [futureDates[1]]: ["10:00 AM", "2:00 PM", "4:00 PM"],
      [futureDates[3]]: ["9:00 AM", "1:00 PM", "3:00 PM"],
      [futureDates[5]]: ["11:00 AM", "2:00 PM", "5:00 PM"],
      [futureDates[7]]: ["10:00 AM", "12:00 PM"],
      [futureDates[9]]: ["1:00 PM", "4:00 PM"]
    }
  },
  {
    name: "Robert Martinez",
    email: "robert.martinez@demo.mentorverse.com",
    title: "Cybersecurity Architect",
    company: "Cisco",
    bio: "Cybersecurity professional with 11+ years of experience protecting enterprise systems and data. Currently working as a Security Architect at Cisco, designing secure network infrastructures. I'm passionate about cybersecurity education and helping others build careers in information security.",
    experience: "Started in network administration, specialized in cybersecurity. Holds multiple security certifications including CISSP and CISM. Led incident response teams and designed security frameworks for Fortune 500 companies.",
    expertise: ["Cybersecurity", "Network Security", "Incident Response", "Risk Assessment", "Compliance", "Penetration Testing", "CISSP", "Security Architecture"],
    linkedin: "https://linkedin.com/in/robert-martinez-demo",
    yearsOfExperience: 11,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
    availability: {
      [futureDates[0]]: ["10:00 AM", "1:00 PM", "4:00 PM"],
      [futureDates[2]]: ["9:00 AM", "11:00 AM", "3:00 PM"],
      [futureDates[4]]: ["1:00 PM", "3:00 PM"],
      [futureDates[6]]: ["10:00 AM", "2:00 PM"],
      [futureDates[8]]: ["9:00 AM", "12:00 PM"]
    }
  },
  {
    name: "Emily Davis",
    email: "emily.davis@demo.mentorverse.com",
    title: "Marketing Director",
    company: "HubSpot",
    bio: "Digital marketing leader with 9+ years of experience in growth marketing, content strategy, and brand development. Currently directing marketing initiatives at HubSpot. I help marketers and entrepreneurs understand modern marketing strategies and build successful campaigns.",
    experience: "Grew from marketing coordinator to director level. Expert in digital marketing channels, marketing automation, and data-driven campaign optimization. Led marketing teams that generated millions in revenue.",
    expertise: ["Digital Marketing", "Content Marketing", "SEO", "Social Media", "Marketing Automation", "Analytics", "Brand Strategy", "Growth Hacking"],
    linkedin: "https://linkedin.com/in/emily-davis-demo",
    yearsOfExperience: 9,
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    availability: {
      [futureDates[1]]: ["9:00 AM", "11:00 AM", "3:00 PM"],
      [futureDates[3]]: ["10:00 AM", "1:00 PM", "4:00 PM"],
      [futureDates[5]]: ["9:00 AM", "12:00 PM", "2:00 PM"],
      [futureDates[7]]: ["11:00 AM", "3:00 PM"],
      [futureDates[9]]: ["10:00 AM", "1:00 PM"]
    }
  },
  {
    name: "Michael Brown",
    email: "michael.brown@demo.mentorverse.com",
    title: "Backend Engineer",
    company: "Stripe",
    bio: "Backend engineering specialist with 8+ years of experience building scalable financial systems. Currently working at Stripe on payment processing infrastructure. I mentor developers on system design, database optimization, and building robust backend services that can handle millions of transactions.",
    experience: "Started as a full-stack developer, specialized in backend systems. Deep experience with distributed systems, database design, and API development. Built systems processing billions of dollars in transactions.",
    expertise: ["Backend Development", "System Design", "PostgreSQL", "Redis", "API Design", "Microservices", "Java", "Distributed Systems"],
    linkedin: "https://linkedin.com/in/michael-brown-demo",
    yearsOfExperience: 8,
    avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face",
    availability: {
      [futureDates[0]]: ["9:00 AM", "12:00 PM", "3:00 PM"],
      [futureDates[2]]: ["10:00 AM", "1:00 PM", "4:00 PM"],
      [futureDates[4]]: ["11:00 AM", "2:00 PM", "5:00 PM"],
      [futureDates[6]]: ["9:00 AM", "1:00 PM"],
      [futureDates[8]]: ["10:00 AM", "3:00 PM"]
    }
  }
];

module.exports = demoMentors;