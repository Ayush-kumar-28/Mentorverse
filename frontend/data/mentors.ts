import type { Mentor, BookedSession } from '../types';

const getFutureDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  // Format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const allMentors: Mentor[] = [
  {
    name: 'Sarah Chen',
    title: 'Principal Software Engineer',
    company: 'Google',
    expertise: ['Distributed Systems', 'Cloud Computing', 'Go', 'Scalability'],
    bio: "I'm a passionate engineer with over 15 years of experience building large-scale distributed systems. I specialize in cloud-native technologies and love mentoring engineers on system design and career growth.",
    experience: [
        { title: 'Principal Software Engineer', company: 'Google', duration: '2018 - Present' },
        { title: 'Senior Software Engineer', company: 'Amazon Web Services', duration: '2014 - 2018' },
        { title: 'Software Engineer', company: 'Microsoft', duration: '2009 - 2014' },
    ],
    linkedin: 'https://www.linkedin.com/in/sarah-chen',
    availability: {
      [getFutureDate(2)]: ['10:00 AM', '11:00 AM', '03:00 PM'],
      [getFutureDate(4)]: ['09:00 AM', '02:00 PM'],
    },
  },
  {
    name: 'Michael Rodriguez',
    title: 'Product Manager, AI Platforms',
    company: 'Netflix',
    expertise: ['Product Strategy', 'Machine Learning', 'A/B Testing'],
    availability: {
      [getFutureDate(1)]: ['09:00 AM', '10:00 AM'],
      [getFutureDate(3)]: ['02:00 PM', '03:00 PM', '04:00 PM'],
    },
  },
  {
    name: 'Emily Carter',
    title: 'Senior UX Designer',
    company: 'Airbnb',
    expertise: ['Design Systems', 'User Research', 'Prototyping', 'Figma'],
     availability: {
      [getFutureDate(2)]: ['11:00 AM', '01:00 PM'],
      [getFutureDate(5)]: ['10:00 AM', '03:00 PM'],
    },
  },
  {
    name: 'David Lee',
    title: 'Engineering Manager',
    company: 'Meta',
    expertise: ['Team Leadership', 'Career Growth', 'React Native', 'Project Management'],
     availability: {
      [getFutureDate(1)]: ['04:00 PM'],
      [getFutureDate(3)]: ['10:00 AM', '11:00 AM'],
      [getFutureDate(6)]: ['09:00 AM'],
    },
  },
  {
    name: 'Jessica Williams',
    title: 'Cybersecurity Analyst',
    company: 'Apple',
    expertise: ['Threat Detection', 'Network Security', 'Penetration Testing'],
    availability: {}, // Limited availability
  },
  {
    name: 'Kevin Martinez',
    title: 'Data Scientist',
    company: 'Spotify',
    expertise: ['Python', 'SQL', 'Data Visualization', 'Recommendation Systems'],
     availability: {
      [getFutureDate(7)]: ['02:00 PM', '03:00 PM'],
    },
  },
    {
    name: 'Laura Garcia',
    title: 'DevOps Engineer',
    company: 'Amazon Web Services',
    expertise: ['CI/CD Pipelines', 'Kubernetes', 'Terraform', 'Infrastructure as Code'],
     availability: {
      [getFutureDate(2)]: ['09:00 AM', '10:00 AM'],
      [getFutureDate(8)]: ['01:00 PM', '02:00 PM'],
    },
  },
  {
    name: 'Chris Taylor',
    title: 'Founder & CTO',
    company: 'Innovatech Startups',
    expertise: ['Entrepreneurship', 'Venture Capital', 'Full-Stack Development', 'SaaS'],
     availability: {
      [getFutureDate(4)]: ['03:00 PM', '04:00 PM', '05:00 PM'],
    },
  },
  {
    name: 'Ritushree Narayan',
    title: 'Blockchain Developer',
    company: 'Polygon',
    expertise: ['Solidity', 'Web3.js', 'Smart Contracts', 'DeFi'],
    availability: {
      [getFutureDate(5)]: ['11:00 AM', '12:00 PM'],
      [getFutureDate(7)]: ['03:00 PM'],
    },
  },
  {
    name: 'Sharmistha Roy',
    title: 'Lead Product Designer',
    company: 'Atlassian',
    expertise: ['Jira', 'Confluence', 'Enterprise UX', 'Agile Design'],
    availability: {
      [getFutureDate(3)]: ['01:00 PM', '02:00 PM'],
      [getFutureDate(6)]: ['10:00 AM', '11:00 AM'],
    },
  },
  {
    name: 'Nagma Khatoon',
    title: 'Senior iOS Engineer',
    company: 'Swiggy',
    expertise: ['Swift', 'SwiftUI', 'CoreData', 'Mobile Architecture'],
    availability: {
      [getFutureDate(2)]: ['04:00 PM'],
      [getFutureDate(4)]: ['10:00 AM', '11:00 AM', '12:00 PM'],
    },
  },
  {
    name: 'Narendra Kumar',
    title: 'Senior Data Engineer',
    company: 'Razorpay',
    expertise: ['Apache Spark', 'ETL Pipelines', 'Airflow', 'Big Data'],
    availability: {
      [getFutureDate(8)]: ['02:00 PM', '03:00 PM'],
    },
  },
  {
    name: 'Goldy Kumari',
    title: 'Frontend Engineer',
    company: 'Zerodha',
    expertise: ['Vue.js', 'Nuxt.js', 'Performance Optimization', 'Accessibility'],
    availability: {
      [getFutureDate(1)]: ['02:00 PM'],
      [getFutureDate(5)]: ['09:00 AM', '10:00 AM'],
    },
  },
];

const mockMentees: Mentor[] = [
  { name: 'Alex Johnson', title: 'Junior Frontend Developer', company: 'Tech Solutions Inc.', expertise: ['JavaScript', 'HTML/CSS'], matchReasoning: 'Eager to learn React and improve component architecture.' },
  { name: 'Brenda Smith', title: 'Computer Science Student', company: 'State University', expertise: ['Python', 'Data Structures'], matchReasoning: 'Wants guidance on landing their first internship in the tech industry.' },
  { name: 'Carlos Gomez', title: 'Aspiring PM', company: 'Self-Employed', expertise: ['Market Research', 'Agile'], matchReasoning: 'Looking to transition from a non-tech role into product management.' },
];

export const mockSessions: BookedSession[] = [
  // Upcoming
  { 
    id: '1',
    mentor: allMentors[0], 
    mentee: mockMentees[0], 
    date: 'Tomorrow', 
    time: '10:00 AM',
    scheduledStart: getFutureDate(1) + 'T10:00:00Z',
    durationMinutes: 60,
    status: 'upcoming',
  },
  { 
    id: '2',
    mentor: allMentors[3], 
    mentee: mockMentees[1], 
    date: 'Next Friday', 
    time: '02:00 PM',
    scheduledStart: getFutureDate(5) + 'T14:00:00Z',
    durationMinutes: 45,
    status: 'upcoming',
  },
  { 
    id: '3',
    mentor: allMentors[1], 
    mentee: mockMentees[2], 
    date: 'October 28th', 
    time: '04:30 PM',
    scheduledStart: '2023-10-28T16:30:00Z',
    durationMinutes: 30,
    status: 'upcoming'
  },
  // Completed
  {
    id: '4',
    mentor: allMentors[1],
    mentee: mockMentees[2],
    date: 'Last Monday',
    time: '04:30 PM',
    scheduledStart: getFutureDate(-7) + 'T16:30:00Z',
    durationMinutes: 30,
    status: 'completed',
    chatHistory: [
      { role: 'other', author: 'Michael Rodriguez', text: "Hey Carlos, looking forward to our session. Have you thought about what you'd like to discuss?" },
      { role: 'user', author: 'You', text: "Hi Michael! Yes, I wanted to go over my resume and talk about how to frame my non-tech experience for a PM role." },
      { role: 'other', author: 'Michael Rodriguez', text: "Perfect, that's a great topic. Come prepared with some questions. See you then!" },
    ]
  },
  {
    id: '5',
    mentor: allMentors[2],
    mentee: mockMentees[0],
    date: 'Two weeks ago',
    time: '11:00 AM',
    scheduledStart: getFutureDate(-14) + 'T11:00:00Z',
    durationMinutes: 60,
    status: 'completed',
    chatHistory: [
      { role: 'other', author: 'Emily Carter', text: "Hi Alex. For our design review, could you bring a link to your portfolio?" },
      { role: 'user', author: 'You', text: "Sure thing, Emily! Here it is: [link]. I'm particularly interested in feedback on the case study for Project X." },
    ]
  }
];