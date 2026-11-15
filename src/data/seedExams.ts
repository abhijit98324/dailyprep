import type { Exam } from '../types';

// Default exam catalogue for DailyPrep.
// NOTE: This file was recreated by Muse on 2026-11-15 because it was missing
// from the uploaded codebase bundle. The exam list follows the standard
// syllabus structure for each exam; the admin can edit/add exams any time
// from the Admin Panel (Exam Manager), which then overrides these defaults.
export const DEFAULT_EXAMS: Exam[] = [
  {
    id: 'ssc-cgl',
    name: 'SSC CGL (Combined Graduate Level)',
    shortName: 'SSC CGL',
    description:
      'Staff Selection Commission Combined Graduate Level exam for Group B and Group C posts in ministries, departments and organisations of the Government of India.',
    subjects: [
      {
        name: 'General Intelligence & Reasoning',
        topics: ['Analogies', 'Coding-Decoding', 'Blood Relations', 'Series', 'Non-Verbal Reasoning', 'Syllogism', 'Puzzles'],
      },
      {
        name: 'General Awareness',
        topics: ['Indian History', 'Geography', 'Indian Polity', 'Indian Economy', 'General Science', 'Current Affairs', 'Static GK'],
      },
      {
        name: 'Quantitative Aptitude',
        topics: ['Number System', 'Percentage', 'Ratio & Proportion', 'Average', 'Profit & Loss', 'Simple & Compound Interest', 'Time & Work', 'Time & Distance', 'Algebra', 'Geometry', 'Trigonometry', 'Data Interpretation'],
      },
      {
        name: 'English Language',
        topics: ['Reading Comprehension', 'Cloze Test', 'Error Spotting', 'Sentence Improvement', 'Synonyms & Antonyms', 'Idioms & Phrases', 'Active & Passive Voice', 'Para Jumbles'],
      },
    ],
  },
  {
    id: 'ssc-chsl',
    name: 'SSC CHSL (10+2) (Combined Higher Secondary Level)',
    shortName: 'SSC CHSL',
    description:
      'Staff Selection Commission Combined Higher Secondary Level exam for LDC, JSA and DEO posts for 12th-pass candidates.',
    subjects: [
      {
        name: 'General Intelligence',
        topics: ['Analogies', 'Coding-Decoding', 'Blood Relations', 'Series', 'Non-Verbal Reasoning', 'Puzzles'],
      },
      {
        name: 'General Awareness',
        topics: ['Indian History', 'Geography', 'Indian Polity', 'Indian Economy', 'General Science', 'Current Affairs', 'Static GK'],
      },
      {
        name: 'Quantitative Aptitude',
        topics: ['Number System', 'Percentage', 'Ratio & Proportion', 'Average', 'Profit & Loss', 'Simple & Compound Interest', 'Time & Work', 'Time & Distance', 'Algebra', 'Geometry', 'Trigonometry', 'Data Interpretation'],
      },
      {
        name: 'English Language',
        topics: ['Reading Comprehension', 'Cloze Test', 'Error Spotting', 'Sentence Improvement', 'Synonyms & Antonyms', 'Idioms & Phrases', 'Para Jumbles'],
      },
    ],
  },
  {
    id: 'ibps-po',
    name: 'IBPS PO (Probationary Officer)',
    shortName: 'IBPS PO',
    description:
      'Institute of Banking Personnel Selection Probationary Officer exam for officer posts in public sector banks.',
    subjects: [
      {
        name: 'Reasoning Ability',
        topics: ['Puzzles & Seating Arrangement', 'Syllogism', 'Blood Relations', 'Alphanumeric Series', 'Inequality', 'Coding-Decoding', 'Data Sufficiency'],
      },
      {
        name: 'Quantitative Aptitude',
        topics: ['Data Interpretation', 'Number Series', 'Simplification & Approximation', 'Quadratic Equations', 'Arithmetic Word Problems', 'Data Sufficiency'],
      },
      {
        name: 'English Language',
        topics: ['Reading Comprehension', 'Cloze Test', 'Para Jumbles', 'Error Detection', 'Fill in the Blanks', 'Sentence Rearrangement'],
      },
      {
        name: 'General Awareness (Banking & Economy)',
        topics: ['Banking Awareness', 'Financial Awareness', 'Government Schemes', 'Current Affairs', 'Static GK'],
      },
      {
        name: 'Computer Aptitude',
        topics: ['Computer Fundamentals', 'Internet & Networking', 'MS Office', 'Keyboard Shortcuts'],
      },
    ],
  },
  {
    id: 'ibps-clerk',
    name: 'IBPS Clerk (Customer Service Associate)',
    shortName: 'IBPS Clerk',
    description:
      'Institute of Banking Personnel Selection Clerk exam for clerical cadre posts in public sector banks.',
    subjects: [
      {
        name: 'Reasoning Ability',
        topics: ['Puzzles & Seating Arrangement', 'Syllogism', 'Blood Relations', 'Alphanumeric Series', 'Inequality', 'Coding-Decoding'],
      },
      {
        name: 'Numerical Ability',
        topics: ['Data Interpretation', 'Number Series', 'Simplification & Approximation', 'Quadratic Equations', 'Arithmetic Word Problems'],
      },
      {
        name: 'English Language',
        topics: ['Reading Comprehension', 'Cloze Test', 'Para Jumbles', 'Error Detection', 'Fill in the Blanks'],
      },
      {
        name: 'General Awareness (Banking & Economy)',
        topics: ['Banking Awareness', 'Financial Awareness', 'Government Schemes', 'Current Affairs', 'Static GK'],
      },
    ],
  },
  {
    id: 'ibps-rrb',
    name: 'IBPS RRB (Officer Scale-I & Office Assistant)',
    shortName: 'IBPS RRB',
    description:
      'Institute of Banking Personnel Selection Regional Rural Banks exam for Officer Scale-I (Assistant Manager) and Office Assistant (Clerk) posts.',
    subjects: [
      {
        name: 'Reasoning',
        topics: ['Puzzles & Seating Arrangement', 'Syllogism', 'Blood Relations', 'Alphanumeric Series', 'Inequality', 'Coding-Decoding', 'Direction Sense'],
      },
      {
        name: 'Quantitative Aptitude',
        topics: ['Data Interpretation', 'Number Series', 'Simplification & Approximation', 'Arithmetic Word Problems', 'Data Sufficiency'],
      },
      {
        name: 'English Language',
        topics: ['Reading Comprehension', 'Cloze Test', 'Para Jumbles', 'Error Detection', 'Fill in the Blanks'],
      },
      {
        name: 'Hindi Language',
        topics: ['Vyakaran', 'Paryayvachi & Vilom Shabd', 'Muhavare', 'Apathit Gadyansh', 'Vakya Sudhar'],
      },
      {
        name: 'General Awareness',
        topics: ['Banking & Financial Awareness', 'Current Affairs', 'Government Schemes', 'Static GK'],
      },
      {
        name: 'Computer Knowledge',
        topics: ['Computer Fundamentals', 'Internet', 'MS Office', 'Hardware & Software'],
      },
    ],
  },
  {
    id: 'rrb-ntpc',
    name: 'RRB NTPC (Railway Non-Technical Popular Categories)',
    shortName: 'RRB NTPC',
    description:
      'Railway Recruitment Board Non-Technical Popular Categories exam for undergraduate and graduate posts in Indian Railways.',
    subjects: [
      {
        name: 'Mathematics',
        topics: ['Number System', 'Percentage', 'Ratio & Proportion', 'Average', 'Profit & Loss', 'Simple & Compound Interest', 'Time & Work', 'Time & Distance', 'Algebra', 'Geometry', 'Trigonometry', 'Statistics'],
      },
      {
        name: 'General Intelligence & Reasoning',
        topics: ['Analogies', 'Coding-Decoding', 'Blood Relations', 'Series', 'Mathematical Operations', 'Non-Verbal Reasoning', 'Puzzles'],
      },
      {
        name: 'General Awareness',
        topics: ['Indian History', 'Geography', 'Indian Polity', 'Indian Economy', 'General Science', 'Current Affairs', 'Static GK', 'Railway GK'],
      },
    ],
  },
  {
    id: 'upsc-cse',
    name: 'UPSC CSE (Civil Services - IAS Prelims)',
    shortName: 'UPSC CSE',
    description:
      'Union Public Service Commission Civil Services Examination (Prelims) for IAS, IPS, IFS and other Group A and Group B services.',
    subjects: [
      {
        name: 'Indian History & Culture',
        topics: ['Ancient India', 'Medieval India', 'Modern India', 'Indian National Movement', 'Art & Culture'],
      },
      {
        name: 'Geography',
        topics: ['Physical Geography', 'Indian Geography', 'World Geography', 'Environment & Ecology'],
      },
      {
        name: 'Indian Polity & Governance',
        topics: ['Constitution', 'Fundamental Rights & Duties', 'Parliament & State Legislatures', 'Judiciary', 'Federal System', 'Governance'],
      },
      {
        name: 'Indian Economy',
        topics: ['Basic Concepts', 'Banking & Finance', 'Budget & Economic Survey', 'Agriculture', 'Industry & Infrastructure'],
      },
      {
        name: 'General Science & Technology',
        topics: ['Physics', 'Chemistry', 'Biology', 'Space & Defence Technology', 'IT & Emerging Tech'],
      },
      {
        name: 'Current Affairs',
        topics: ['National Events', 'International Events', 'Government Schemes', 'Awards & Reports', 'Sports'],
      },
      {
        name: 'CSAT (Paper II)',
        topics: ['Comprehension', 'Logical Reasoning', 'Basic Numeracy', 'Data Interpretation', 'Decision Making'],
      },
    ],
  },
];
