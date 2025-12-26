import type { Doubt } from '../types';

export const mockDoubts: Doubt[] = [
  {
    id: 'doubt-1',
    title: 'How to handle system design questions for a junior role?',
    description: "I have an interview coming up and they mentioned a system design round. I'm not sure what to expect for a junior position. Any advice on what to focus on?",
    author: 'Alex J.',
    participants: 5,
    messages: [
      { role: 'other', author: 'Brenda S.', text: "Hey Alex! For junior roles, they usually focus on trade-offs and your thought process. Don't worry about getting the 'perfect' answer." },
      { role: 'other', author: 'Carlos G.', text: "Yeah, I'd suggest starting with clarifying questions. Like, what's the expected scale? What are the core features?" },
    ],
  },
  {
    id: 'doubt-2',
    title: 'Is it better to learn Go or Rust in 2024 for backend?',
    description: "I'm comfortable with Python and Node.js but want to learn a compiled language for performance. Can't decide between Go and Rust. What are the pros and cons for job prospects?",
    author: 'Maria K.',
    participants: 8,
    messages: [
       { role: 'other', author: 'Alex J.', text: 'Go is generally considered easier to learn and has a great ecosystem for web services.' },
       { role: 'other', author: 'Brenda S.', text: "Rust is more complex due to its focus on memory safety, but it's super powerful for systems programming. The learning curve is steep though." }
    ],
  },
    {
    id: 'doubt-3',
    title: 'Tips for negotiating salary for the first time?',
    description: "I think I'm about to get my first offer, but I have no idea how to approach salary negotiation. It feels awkward. What are some good strategies?",
    author: 'Sam T.',
    participants: 12,
    messages: [],
  },
];
