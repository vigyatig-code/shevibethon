// All civic content in one replaceable object.
// Replace demo data with real civic data by updating this file.

export interface HeroCopy {
  eyebrow: string
  headline: string
  description: string
  primaryCta: string
  secondaryCta: string
  microcopy: string
  scrollCue: string
}

export const heroVariations: Record<string, HeroCopy> = {
  A: {
    eyebrow: 'Your place. Your voice. Our shared future.',
    headline: 'NAZAR',
    description:
      'Discover what is changing in your community, share what needs attention, and help shape the places we all call home.',
    primaryCta: 'Share your idea',
    secondaryCta: 'Explore local progress',
    microcopy: 'Every suggestion helps us understand what matters most to residents.',
    scrollCue: 'See what your community is shaping',
  },
  B: {
    eyebrow: 'Civic action starts here',
    headline: 'See a need? Help shape the next step.',
    description:
      'Report a local concern, explore active projects, and add your perspective to the decisions shaping everyday life.',
    primaryCta: 'Have your say',
    secondaryCta: 'Find a local project',
    microcopy: 'Simple actions. Shared priorities. Visible progress.',
    scrollCue: 'Explore the work in motion',
  },
  C: {
    eyebrow: 'Closer to home',
    headline: 'Change is taking root in every neighborhood.',
    description:
      'Follow improvements near you, discover community-led initiatives, and tell us what would make your area greener, safer, and more connected.',
    primaryCta: 'Explore your neighborhood',
    secondaryCta: 'Add a suggestion',
    microcopy: 'Your local knowledge makes better public decisions possible.',
    scrollCue: 'Find your community constellation',
  },
  D: {
    eyebrow: 'Built with the people who live here',
    headline: 'The future of our community is something we create together.',
    description:
      'From small everyday improvements to long-term city plans, your experience belongs in the conversation.',
    primaryCta: 'Join the conversation',
    secondaryCta: 'See what is changing',
    microcopy: 'Listen. Act. Learn. Improve.',
    scrollCue: 'Follow the path from idea to impact',
  },
  E: {
    eyebrow: 'Open progress, shared responsibility',
    headline: 'Know what is happening. Help decide what comes next.',
    description:
      'Explore public projects, understand their progress, and add your voice to the priorities that shape our shared future.',
    primaryCta: 'View civic progress',
    secondaryCta: 'Suggest an improvement',
    microcopy: 'Clear information for better participation.',
    scrollCue: 'See the story behind the progress',
  },
  F: {
    eyebrow: 'The community constellation is growing',
    headline: 'One idea can light the way for many.',
    description:
      'Place a suggestion on the community map, discover what neighbors are asking for, and follow ideas as they move toward action.',
    primaryCta: 'Drop your suggestion',
    secondaryCta: 'Explore community voices',
    microcopy: 'Your idea may be local. Its impact can reach much further.',
    scrollCue: 'Explore the voices around you',
  },
}

export const activeHeroVariation = 'A'

export const trustIndicators = [
  'Open data',
  'Community-led',
  'Progress you can see',
]

export interface ImpactMetric {
  label: string
  value: number
  suffix: string
  isDemo: boolean
}

export const impactMetrics: ImpactMetric[] = [
  { label: 'Issues resolved this year', value: 32480, suffix: '', isDemo: true },
  { label: 'Active civic projects', value: 156, suffix: '', isDemo: true },
  { label: 'Cities connected', value: 28, suffix: '', isDemo: true },
  { label: 'Citizens engaged', value: 89200, suffix: '+', isDemo: true },
]

export interface PriorityCard {
  id: string
  title: string
  description: string
  link: string
  icon: string
  externalLink: string
  imageSrc: string
}

export const priorityCards: PriorityCard[] = [
  {
    id: 'greener',
    title: 'Greener neighborhoods',
    description: 'More trees, cleaner streets, healthier public spaces.',
    link: '/complaints',
    icon: 'sprout',
    externalLink: 'https://www.iamgurgaon.org/initiatives/aravalli-biodiversity-park-gurugram',
    imageSrc: 'https://images.pexels.com/photos/35085388/pexels-photo-35085388.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'safer',
    title: 'Safer streets',
    description: 'Practical improvements shaped by the people who use them every day.',
    link: '/complaints',
    icon: 'shield',
    externalLink: 'https://raahgirifoundation.org/vision-zero/',
    imageSrc: 'https://images.pexels.com/photos/19431597/pexels-photo-19431597.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'services',
    title: 'Better services',
    description: 'Clearer access to support, information, and local resources.',
    link: '/file',
    icon: 'building',
    externalLink: 'https://www.ichangemycity.com',
    imageSrc: 'https://images.pexels.com/photos/34921843/pexels-photo-34921843.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 'communities',
    title: 'Stronger communities',
    description: 'More opportunities to connect, contribute, and be heard.',
    link: '/track',
    icon: 'users',
    externalLink: 'https://prizeforcities.org/database/restoration-urban-common-through-community-integration-model',
    imageSrc: 'https://images.pexels.com/photos/18460456/pexels-photo-18460456.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
]

export interface TimelineStage {
  id: string
  title: string
  description: string
  icon: string
}

export const timelineStages: TimelineStage[] = [
  {
    id: 'listen',
    title: 'Listen',
    description: 'We begin with residents’ experiences and local knowledge.',
    icon: 'ear',
  },
  {
    id: 'plan',
    title: 'Plan',
    description: 'We turn shared priorities into practical, measurable plans.',
    icon: 'clipboard',
  },
  {
    id: 'build',
    title: 'Build',
    description: 'We deliver improvements with transparency and care.',
    icon: 'hammer',
  },
  {
    id: 'measure',
    title: 'Measure',
    description: 'We publish progress and learn what should happen next.',
    icon: 'chart',
  },
  {
    id: 'review',
    title: 'Review',
    description: 'We assess outcomes against resident expectations and ground reality.',
    icon: 'search',
  },
  {
    id: 'refine',
    title: 'Refine',
    description: 'We adjust course based on feedback, data, and what residents tell us.',
    icon: 'refresh',
  },
  {
    id: 'sustain',
    title: 'Sustain',
    description: 'We maintain what works and keep the community informed throughout.',
    icon: 'shield',
  },
]

export interface Initiative {
  id: string
  title: string
  description: string
  status: string
  location: string
  progress: number
  link: string
  gradient: string
}

export const initiatives: Initiative[] = [
  {
    id: '1',
    title: 'Urban Tree Canopy Expansion',
    description: 'Planting 5,000 native trees across priority neighborhoods in Bengaluru and Mumbai to reduce heat and improve air quality.',
    status: 'In progress',
    location: 'Ministry of Environment, Forest & Climate Change',
    progress: 62,
    link: '/insights',
    gradient: 'linear-gradient(135deg, #6f4e37 0%, #8a6a4f 50%, #a96545 100%)',
  },
  {
    id: '2',
    title: 'Safe Routes to Schools',
    description: 'Upgrading crosswalks, lighting, and speed breakers near 18 school zones across Delhi and Hyderabad.',
    status: 'In planning',
    location: 'Ministry of Road Transport & Highways',
    progress: 28,
    link: '/insights',
    gradient: 'linear-gradient(135deg, #7a5a3e 0%, #8a6a4f 50%, #c4976a 100%)',
  },
  {
    id: '3',
    title: 'Monsoon Drainage Cleanup',
    description: 'Clearing and desilting major storm drains in Kolkata and Chennai ahead of monsoon season.',
    status: 'Delivered',
    location: 'Ministry of Jal Shakti',
    progress: 100,
    link: '/insights',
    gradient: 'linear-gradient(135deg, #8a6a4f 0%, #a96545 50%, #c4976a 100%)',
  },
]

export interface Testimonial {
  id: string
  name: string
  role: string
  quote: string
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    role: 'Indiranagar, Bengaluru',
    quote:
      'I reported a broken streetlight on MG Road and within two weeks it was fixed. Seeing the progress publicly made me feel heard.',
  },
  {
    id: '2',
    name: 'Rahul Verma',
    role: 'Andheri West, Mumbai',
    quote:
      'The tree planting initiative changed our lane. It is cooler in summer and the kids have shade to play in.',
  },
  {
    id: '3',
    name: 'Ananya Reddy',
    role: 'Banjara Hills, Hyderabad',
    quote:
      'I dropped a suggestion for a new speed breaker near the school. It is now being reviewed. The process was transparent.',
  },
  {
    id: '4',
    name: 'Arjun Singh',
    role: 'Salt Lake, Kolkata',
    quote:
      'Being able to track complaints and see real outcomes builds trust. This is how public services should work.',
  },
  {
    id: '5',
    name: 'Meena Iyer',
    role: 'Anna Nagar, Chennai',
    quote:
      'I used the community map to see what neighbors were asking for. It made me realize we share the same concerns about waterlogging.',
  },
]

export interface CommunityPin {
  id: string
  title: string
  description: string
  area: string
  topic: string
  status: string
  supporters: number
  date: string
  x: number
  y: number
}

export const communityPinStatuses = [
  'New idea',
  'Being reviewed',
  'In planning',
  'In progress',
  'Delivered',
  'Unable to progress',
] as const

export const pinStatusColors: Record<string, string> = {
  'New idea': '#c4976a',
  'Being reviewed': '#a96545',
  'In planning': '#6f4e37',
  'In progress': '#7a5a3e',
  'Delivered': '#8a6a4f',
  'Unable to progress': '#b8a088',
}

export const demoPins: CommunityPin[] = [
  {
    id: 'p1',
    title: 'Pothole repair on Brigade Road',
    description: 'The road near Brigade Road junction has deep potholes causing accidents and vehicle damage during monsoon.',
    area: 'Indiranagar, Bengaluru',
    topic: 'Public services',
    status: 'In progress',
    supporters: 142,
    date: '2026-08-15',
    x: 25,
    y: 35,
  },
  {
    id: 'p2',
    title: 'Streetlight not working near bus stop',
    description: 'The streetlight near the Andheri bus stop has been out for two weeks, making the area unsafe at night.',
    area: 'Andheri West, Mumbai',
    topic: 'Safety',
    status: 'Being reviewed',
    supporters: 89,
    date: '2026-09-01',
    x: 32,
    y: 48,
  },
  {
    id: 'p3',
    title: 'Garbage piling on Anna Salai',
    description: 'Waste collection has not happened on our street for over a week. The pile-up is causing health concerns.',
    area: 'Anna Nagar, Chennai',
    topic: 'Public services',
    status: 'New idea',
    supporters: 34,
    date: '2026-09-10',
    x: 55,
    y: 22,
  },
  {
    id: 'p4',
    title: 'Drainage overflow in Salt Lake',
    description: 'The drains near Sector 5 are overflowing after the last monsoon rain, flooding the street and causing waterlogging.',
    area: 'Salt Lake, Kolkata',
    topic: 'Public services',
    status: 'Delivered',
    supporters: 210,
    date: '2026-06-20',
    x: 68,
    y: 60,
  },
  {
    id: 'p5',
    title: 'Speed breaker near school zone',
    description: 'Vehicles speed past the school on Banjara Hills Road 12. A speed breaker would make it safe for children.',
    area: 'Banjara Hills, Hyderabad',
    topic: 'Safety',
    status: 'In planning',
    supporters: 67,
    date: '2026-08-28',
    x: 45,
    y: 72,
  },
  {
    id: 'p6',
    title: 'Water pipeline leakage on Ring Road',
    description: 'A major water leak on Ring Road has been flooding the road for three days. Clean water is being wasted.',
    area: 'Connaught Place, Delhi',
    topic: 'Public services',
    status: 'Unable to progress',
    supporters: 45,
    date: '2026-07-12',
    x: 78,
    y: 40,
  },
]

export const communityTopics = [
  'Green space',
  'Transport',
  'Safety',
  'Public services',
  'Culture',
  'Accessibility',
  'Other',
]

export const communityAreas = [
  'Indiranagar, Bengaluru',
  'Andheri West, Mumbai',
  'Anna Nagar, Chennai',
  'Salt Lake, Kolkata',
  'Banjara Hills, Hyderabad',
  'Connaught Place, Delhi',
]

export const communityFilters = [
  'All voices',
  'Newest',
  'Most supported',
  'Under review',
  'In progress',
  'Delivered',
]

export const participationContent = {
  heading: 'Your voice belongs in the next chapter.',
  description:
    'Good civic work is a conversation. Share an idea, report a problem, join a consultation, or support a project near you.',
  buttons: [
    { label: 'Share an idea', link: '/file' },
    { label: 'Report an issue', link: '/file' },
    { label: 'Join the community', link: '/complaints' },
  ],
}

export const footerContent = {
  organization: 'Civic Complaint Portal — India',
  address: 'Sansad Marg, New Delhi, 110001',
  phone: '+91 11 2334 0000',
  email: 'contact@civicportal.gov.in',
  hours: 'Mon–Fri, 9:00 AM – 5:00 PM IST',
  links: [
    { label: 'About Us', link: '/about' },
    { label: 'FAQs', link: '/faqs' },
    { label: 'Accessibility', link: '/accessibility' },
    { label: 'Open Data', link: '/insights' },
  ],
  social: [
    { label: 'Twitter', link: '#' },
    { label: 'Facebook', link: '#' },
    { label: 'Instagram', link: '#' },
  ],
  disclaimer:
    'For emergencies, call your local emergency services number. This portal is not monitored 24/7 and is not for urgent or emergency reports.',
}
