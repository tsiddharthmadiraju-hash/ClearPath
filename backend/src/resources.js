
export const UNIVERSAL_211 = {
  name: '211 Helpline',
  type: 'Community resource hotline',
  what_they_do:
    'Free information and referrals for all community services including housing, food, health, and legal help.',
  phone: '211',
  website: 'https://www.211.org',
  call_script:
    'Hi, I received an official document and I need help understanding my options. Can you connect me with someone who can help?',
};

const CATEGORIES = {
  housing: [
    {
      name: 'Legal Aid Corporation',
      type: 'Free legal services',
      what_they_do:
        'Free legal help for low-income residents facing eviction or housing issues.',
      phone: '1-800-551-5681',
      website: 'https://www.lawhelp.org',
      call_script:
        'Hi, I received an eviction notice and I need free legal help. I am low income and cannot afford an attorney.',
    },
    {
      name: 'National Housing Law Project',
      type: 'Tenant rights organization',
      what_they_do:
        'Tenant rights resources and referrals to local housing attorneys.',
      phone: '415-546-7000',
      website: 'https://www.nhlp.org',
      call_script:
        'Hi, I need help understanding my rights as a tenant. I received a notice and need guidance.',
    },
  ],
  benefits: [
    {
      name: 'Benefits.gov Help Line',
      type: 'Federal benefits navigation',
      what_they_do:
        'Help navigating federal benefit programs including SNAP, Medicaid, and SSI.',
      phone: '1-800-333-4636',
      website: 'https://www.benefits.gov',
      call_script:
        'Hi, I received a letter about my benefits being changed and I need help understanding what it means and what to do.',
    },
    {
      name: 'Benefits Data Trust',
      type: 'Benefits enrollment assistance',
      what_they_do: 'Free help enrolling in benefits you may be eligible for.',
      phone: '1-888-698-0241',
      website: 'https://bdtrust.org',
      call_script:
        'Hi, I need help understanding a letter about my benefits and finding out what I am eligible for.',
    },
  ],
  medical: [
    {
      name: 'Patient Advocate Foundation',
      type: 'Patient case management',
      what_they_do:
        'Free case managers to help patients navigate medical bills and insurance.',
      phone: '1-800-532-5274',
      website: 'https://www.patientadvocate.org',
      call_script:
        'Hi, I received hospital discharge instructions and a medical bill I do not understand. I need help navigating this.',
    },
    {
      name: 'CMS Medicare Help Line',
      type: 'Government Medicare support',
      what_they_do: 'Official Medicare questions, appeals, and coverage disputes.',
      phone: '1-800-633-4227',
      website: 'https://www.medicare.gov',
      call_script:
        'Hi, I received a letter about my Medicare coverage and I need help understanding what it means.',
    },
  ],
  school: [
    {
      name: 'National Education Association Help Line',
      type: 'Parent and student rights resource',
      what_they_do:
        'Parent resources for school notices, IEPs, suspensions, and student rights.',
      phone: '1-202-833-4000',
      website: 'https://www.nea.org',
      call_script:
        "Hi, I received a notice from my child's school and I need help understanding my rights as a parent.",
    },
  ],
  utility: [
    {
      name: 'LIHEAP Energy Assistance',
      type: 'Federal energy assistance program',
      what_they_do:
        'Federal program helping low-income households pay energy bills and avoid shutoffs.',
      phone: '1-866-674-6327',
      website: 'https://www.acf.hhs.gov/ocs/liheap',
      call_script:
        'Hi, I received a utility shutoff notice and I need help with emergency energy assistance.',
    },
  ],
};

function categoryForDocumentType(documentType) {
  const t = String(documentType || '').toLowerCase();
  if (/evict|housing|tenant|landlord|vacate|\brent\b|lease|foreclosur|detainer/.test(t)) return 'housing';
  if (/benefit|snap|food.?stamp|medicaid|\bssi\b|welfare|\btanf\b|cash assistance|adverse action/.test(t)) return 'benefits';
  if (/medical|hospital|discharge|medicare|patient|health|insurance|\bbill\b|clinic|surgery|prescription/.test(t)) return 'medical';
  if (/school|educat|truan|absence|attendance|\biep\b|suspension|student|expulsion/.test(t)) return 'school';
  if (/utilit|shut.?off|disconnect|electric|\bgas\b|water|power|energy/.test(t)) return 'utility';
  return null;
}

export function getResourcesForDocumentType(documentType) {
  const category = categoryForDocumentType(documentType);
  const specific = category ? CATEGORIES[category] : [];
  return [UNIVERSAL_211, ...specific];
}
