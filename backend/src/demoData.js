
const DISCLAIMER =
  'ClearPath explains documents to help you understand your situation. It does not provide legal advice. If your situation is urgent, call 211 now.';

const R_211 = {
  name: '211 Helpline',
  type: 'Community resource hotline',
  what_they_do:
    'Free information and referrals for all community services including housing, food, health, and legal help.',
  phone: '211',
  website: 'https://www.211.org',
  call_script:
    'Hi, I received an official document and I need help understanding my options. Can you connect me with someone who can help?',
};

export const DEMO_RESPONSES = {
  eviction: {
    document_type: 'Residential Eviction Notice',
    confidence: 'high',
    confidence_reason:
      'The notice clearly states the amount owed, the reason, and a specific deadline to pay or move out.',
    plain_explanation:
      'Your landlord is informing you that you owe $1,200 in unpaid rent. You have 5 days from the date on this notice to either pay the full amount or move out. If you do neither, your landlord can file for eviction in court.',
    action_checklist: [
      { step: 1, action: 'Contact your landlord today to discuss a payment plan', deadline: 'Today', urgency: 'immediate', detail: 'Ask in writing (text or email) so you have a record of the conversation.' },
      { step: 2, action: 'Call 211 for emergency rental assistance in your area', deadline: 'Today', urgency: 'immediate', detail: 'There may be local funds that can cover what you owe and stop the eviction.' },
      { step: 3, action: 'Call a legal aid organization for free advice', deadline: 'Within 2 days', urgency: 'immediate', detail: 'They can tell you whether the notice follows your state’s law and whether you can fight it.' },
      { step: 4, action: 'If you pay, get a written receipt from your landlord', deadline: 'When you pay', urgency: 'this_week', detail: 'A receipt protects you if there is any later dispute about whether you paid.' },
    ],
    resources: [
      R_211,
      { name: 'Legal Aid Corporation', type: 'Free legal services', what_they_do: 'Free legal help for low-income residents facing eviction or housing issues.', phone: '1-800-551-5681', website: 'https://www.lawhelp.org', call_script: 'Hi, I received an eviction notice and I need free legal help. I am low income and cannot afford an attorney.' },
      { name: 'National Housing Law Project', type: 'Tenant rights organization', what_they_do: 'Tenant rights resources and referrals to local housing attorneys.', phone: '415-546-7000', website: 'https://www.nhlp.org', call_script: 'Hi, I need help understanding my rights as a tenant. I received a notice and need guidance.' },
    ],
    disclaimer: DISCLAIMER,
  },

  benefits: {
    document_type: 'Benefits Termination Notice (SNAP)',
    confidence: 'high',
    confidence_reason:
      'The notice states a specific benefit, an effective end date, and your right to appeal within a clear time window.',
    plain_explanation:
      'This letter says your food assistance (SNAP) benefits will stop on the date listed because the agency believes your household income went over the limit. Importantly, you have the right to appeal. If you ask for a hearing within 10 days, your benefits can keep coming at the same amount until a decision is made.',
    action_checklist: [
      { step: 1, action: 'Request a fair hearing (appeal) within 10 days', deadline: 'Within 10 days of the notice date', urgency: 'immediate', detail: 'Appealing within 10 days is what keeps your benefits going during the review.' },
      { step: 2, action: 'Call your local benefits office to confirm how to appeal', deadline: 'Today', urgency: 'immediate', detail: 'Ask them to note the date you called and to send written confirmation of your appeal.' },
      { step: 3, action: 'Gather proof of your current income', deadline: 'This week', urgency: 'this_week', detail: 'Recent pay stubs or a letter from your employer can show your real income if the agency made an error.' },
      { step: 4, action: 'Call Benefits.gov for help understanding your options', deadline: 'This week', urgency: 'this_week', detail: 'They can explain the program rules and what counts toward the income limit.' },
    ],
    resources: [
      R_211,
      { name: 'Benefits.gov Help Line', type: 'Federal benefits navigation', what_they_do: 'Help navigating federal benefit programs including SNAP, Medicaid, and SSI.', phone: '1-800-333-4636', website: 'https://www.benefits.gov', call_script: 'Hi, I received a letter about my benefits being changed and I need help understanding what it means and what to do.' },
      { name: 'Benefits Data Trust', type: 'Benefits enrollment assistance', what_they_do: 'Free help enrolling in benefits you may be eligible for.', phone: '1-888-698-0241', website: 'https://bdtrust.org', call_script: 'Hi, I need help understanding a letter about my benefits and finding out what I am eligible for.' },
    ],
    disclaimer: DISCLAIMER,
  },

  discharge: {
    document_type: 'Hospital Discharge Instructions',
    confidence: 'high',
    confidence_reason:
      'The instructions clearly list medications, wound care, a follow-up date, and warning signs.',
    plain_explanation:
      'These are your instructions for taking care of yourself at home after your surgery. They tell you which medicines to take and when, how to care for your wound, when to come back for a check-up, and the warning signs that mean you should call your doctor right away.',
    action_checklist: [
      { step: 1, action: 'Take your antibiotic (Amoxicillin) exactly as written, twice daily for 7 days', deadline: 'Starting today', urgency: 'immediate', detail: 'Finish all 7 days even if you feel better, so the infection does not come back.' },
      { step: 2, action: 'Keep your incision clean and dry — do not submerge it in water for 7 days', deadline: 'For 7 days', urgency: 'this_week', detail: 'Short showers are usually fine, but no baths, pools, or hot tubs until cleared.' },
      { step: 3, action: 'Book your follow-up appointment for the date on your sheet', deadline: 'By your follow-up date', urgency: 'this_week', detail: 'Call the surgical clinic now to confirm the time so you do not miss it.' },
      { step: 4, action: 'Call your doctor immediately if you get a fever over 101°F, increasing redness, swelling, or drainage', deadline: 'If symptoms appear', urgency: 'immediate', detail: 'These can be signs of infection that need quick treatment.' },
    ],
    resources: [
      R_211,
      { name: 'Patient Advocate Foundation', type: 'Patient case management', what_they_do: 'Free case managers to help patients navigate medical bills and insurance.', phone: '1-800-532-5274', website: 'https://www.patientadvocate.org', call_script: 'Hi, I received hospital discharge instructions and a medical bill I do not understand. I need help navigating this.' },
      { name: 'CMS Medicare Help Line', type: 'Government Medicare support', what_they_do: 'Official Medicare questions, appeals, and coverage disputes.', phone: '1-800-633-4227', website: 'https://www.medicare.gov', call_script: 'Hi, I received a letter about my Medicare coverage and I need help understanding what it means.' },
    ],
    disclaimer: DISCLAIMER,
  },

  school: {
    document_type: 'School Attendance Warning (Truancy Notice)',
    confidence: 'high',
    confidence_reason:
      'The notice states a specific number of absences, the law involved, and a clear deadline to respond.',
    plain_explanation:
      "This notice says your child has too many unexcused absences this term, which is over the limit set by the state's attendance law. The school is asking you to respond within 7 days to explain the absences and set up a plan. If you do not respond, the school may refer the case to truancy court.",
    action_checklist: [
      { step: 1, action: 'Call the school attendance office within 7 days', deadline: 'Within 7 days', urgency: 'immediate', detail: 'Responding on time shows you are engaged and usually prevents a court referral.' },
      { step: 2, action: 'Gather any documents that explain the absences', deadline: 'This week', urgency: 'this_week', detail: 'Doctor’s notes, family emergencies, or transportation problems can change unexcused absences to excused.' },
      { step: 3, action: 'Ask the school to set up an attendance improvement plan', deadline: 'This week', urgency: 'this_week', detail: 'A written plan protects your child and shows the court you are cooperating if it ever gets that far.' },
      { step: 4, action: 'Call the NEA Help Line if you need to understand your rights as a parent', deadline: 'This week', urgency: 'this_week', detail: 'They can explain the process and what the school can and cannot require.' },
    ],
    resources: [
      R_211,
      { name: 'National Education Association Help Line', type: 'Parent and student rights resource', what_they_do: 'Parent resources for school notices, IEPs, suspensions, and student rights.', phone: '1-202-833-4000', website: 'https://www.nea.org', call_script: "Hi, I received a notice from my child's school and I need help understanding my rights as a parent." },
    ],
    disclaimer: DISCLAIMER,
  },

  utility: {
    document_type: 'Utility Disconnection Notice',
    confidence: 'high',
    confidence_reason:
      'The notice states the past-due amount, the service at risk, and a specific shutoff date.',
    plain_explanation:
      'This notice says your electric service is scheduled to be shut off on the date listed because of a past-due balance of $284.57. To keep your power on, you need to pay the balance or set up a payment plan before that date. You may also qualify for assistance that helps cover the bill.',
    action_checklist: [
      { step: 1, action: 'Call your utility company today to ask for a payment plan', deadline: 'Today', urgency: 'immediate', detail: 'Most companies will pause a shutoff if you set up a plan before the disconnection date.' },
      { step: 2, action: 'Apply for LIHEAP emergency energy assistance', deadline: 'Before the shutoff date', urgency: 'immediate', detail: 'This federal program can help pay the overdue balance for qualifying households.' },
      { step: 3, action: 'Call 211 to find local utility assistance funds', deadline: 'Today', urgency: 'immediate', detail: 'Many areas have one-time emergency funds that pay utility bills.' },
      { step: 4, action: 'Ask if you qualify for a medical or weather protection from shutoff', deadline: 'This week', urgency: 'this_week', detail: 'Some states block shutoffs in extreme heat/cold or when someone relies on medical equipment.' },
    ],
    resources: [
      R_211,
      { name: 'LIHEAP Energy Assistance', type: 'Federal energy assistance program', what_they_do: 'Federal program helping low-income households pay energy bills and avoid shutoffs.', phone: '1-866-674-6327', website: 'https://www.acf.hhs.gov/ocs/liheap', call_script: 'Hi, I received a utility shutoff notice and I need help with emergency energy assistance.' },
    ],
    disclaimer: DISCLAIMER,
  },
};

export function getDemoResponse(demoType) {
  const key = String(demoType || '').toLowerCase().trim();
  const found = DEMO_RESPONSES[key];
  return found ? JSON.parse(JSON.stringify(found)) : null;
}
