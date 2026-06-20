export type Section =
  | 'home'
  | 'pdf-tools'
  | 'resume-maker'
  | 'typing-test'
  | 'image-tools'
  | 'notes-syllabus'
  | 'services-products'
  | 'blog'
  | 'communities'
  | 'admin';

export interface PDFTool {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: 'organize' | 'convert-to' | 'convert-from' | 'security' | 'edit';
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  summary: string;
  education: {
    degree: string;
    school: string;
    year: string;
    percentage: string;
  }[];
  experience: {
    role: string;
    company: string;
    duration: string;
    details: string;
  }[];
  skills: string[];
  languages: string[];
  projects: {
    name: string;
    description: string;
    link?: string;
  }[];
}

export interface TypingResult {
  wpm: number;
  accuracy: number;
  errors: number;
  textLength: number;
  timeSpent: number;
  date: string;
}

export interface ClassNote {
  id: string;
  title: string;
  subject: string;
  content: string;
  summary: string;
  date: string;
  downloads: number;
  fileSize: string;
  readingTime: string;
  isPremium?: boolean;
  price?: number;
  fileUrl?: string;
}

export interface SyllabusItem {
  id: string;
  title: string;
  examType: string; // e.g., SSC, Railway, Banking, UPSC
  totalMarks: number;
  sections: {
    name: string;
    questions: number;
    marks: number;
    topics: string[];
  }[];
  duration: string;
  negativeMarking: string;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  subject: string;
  fileSize: string;
  downloads: number;
  isPremium: boolean;
  price?: number;
  fileUrl?: string;
}

export interface PortfolioService {
  id: string;
  name: string;
  description: string;
  priceEstimate: string;
  deliveryTime: string;
  iconName: string;
  features: string[];
}

export interface ProductItem {
  id: string;
  name: string;
  category: 'ebook' | 'template' | 'course' | 'tool';
  price: number;
  originalPrice: number;
  description: string;
  image: string;
  rating: number;
  features: string[];
}

export interface NoticeItem {
  id: string;
  title: string;
  category: 'job' | 'admit-card' | 'result' | 'class-update';
  date: string;
  isNew: boolean;
  details: string;
  linkText?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'tech' | 'career' | 'studytips' | 'pdf-guide';
  date: string;
  reads: number;
  likes: number;
  image: string;
  comments: {
    author: string;
    text: string;
    date: string;
  }[];
}
