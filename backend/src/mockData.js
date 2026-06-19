/**
 * Deterministic mock analyses so ClearPath demos end-to-end with NO API key.
 * Set CLEARPATH_MOCK=1 (or simply omit ANTHROPIC_API_KEY) to use these.
 *
 * Each entry mirrors exactly the JSON contract Claude returns, so the same
 * frontend code renders mock and live responses identically. They double as the
 * five synthetic demo documents referenced in the build plan.
 */

export const EVICTION = {
  document_type: 'Eviction Notice',
  plain_explanation:
    'This is a notice that says your landlord wants you to move out or fix a problem. You have 5 days to respond in writing or pay what you owe. If you do nothing, the landlord can ask a judge to remove you. You still have the right to respond and tell your side.',
  action_checklist: [
    {
      step: 1,
      action: 'Respond in writing before the 5-day deadline',
      deadline: '5 days from the date on this notice',
      urgency: 'immediate',
      detail: 'If you miss this deadline, the case can move forward without you.',
    },
    {
      step: 2,
      action: 'Call a local legal aid office for free help',
      deadline: null,
      urgency: 'immediate',
      detail: 'They can review your notice and help you write your response.',
    },
    {
      step: 3,
      action: 'Gather your lease, rent receipts, and any messages with your landlord',
      deadline: null,
      urgency: 'this_week',
      detail: 'These documents help prove your side if the case goes to court.',
    },
  ],
  resources: [
    {
      name: '211',
      type: 'Community resource hotline',
      what_they_do:
        'Free 24/7 service that connects you to local housing help and legal aid.',
      phone: '211',
      website: 'https://www.211.org',
      call_script:
        'Hi, I received a 5-day eviction notice and I need help understanding my options and finding free legal aid near me.',
    },
    {
      name: 'Legal Aid (housing)',
      type: 'Free legal services',
      what_they_do:
        'Provides free legal help to income-eligible tenants facing eviction.',
      phone: '(214) 555-0100',
      website: null,
      call_script:
        'I got a 5-day notice to vacate. I want to respond and I need to know my rights as a tenant. Can someone review my notice with me?',
    },
    {
      name: 'Tenant Rights Hotline',
      type: 'Tenant advocacy',
      what_they_do:
        'Explains tenant rights and the eviction process for your area.',
      phone: '(214) 555-0144',
      website: null,
      call_script:
        'I have a 5-day notice and I am not sure what to do next. Can you walk me through what my response should include?',
    },
  ],
  confidence: 'high',
  confidence_reason:
    'The document clearly states it is an eviction notice with an explicit 5-day deadline.',
  disclaimer:
    'ClearPath explains documents to help you understand your situation. It does not provide legal advice. If your situation is urgent, call 211 now.',
};

export const BENEFITS = {
  document_type: 'Benefits Termination Notice (SNAP)',
  plain_explanation:
    'This letter says your food assistance (SNAP) will stop because the office thinks your income changed. You have 10 days to appeal if you disagree. If you appeal in time, your benefits may continue while they review your case. You do not have to accept this decision without a review.',
  action_checklist: [
    {
      step: 1,
      action: 'File an appeal within 10 days to keep your benefits during review',
      deadline: '10 days from the date on this letter',
      urgency: 'immediate',
      detail: 'Appealing on time can keep your food assistance active while they decide.',
    },
    {
      step: 2,
      action: 'Gather recent pay stubs or proof of your current income',
      deadline: null,
      urgency: 'this_week',
      detail: 'This shows whether the income change they listed is correct.',
    },
    {
      step: 3,
      action: 'Call your local benefits office to confirm they received your appeal',
      deadline: null,
      urgency: 'this_week',
      detail: 'Keep a note of the date, time, and who you spoke with.',
    },
  ],
  resources: [
    {
      name: '211',
      type: 'Community resource hotline',
      what_they_do:
        'Connects you to benefits counselors and food assistance near you.',
      phone: '211',
      website: 'https://www.211.org',
      call_script:
        'My SNAP benefits are being cut off and I have 10 days to appeal. I need help filing the appeal and finding food help in the meantime.',
    },
    {
      name: 'Benefits Counseling Hotline',
      type: 'Public benefits help',
      what_they_do:
        'Helps you appeal SNAP, Medicaid, and other benefit decisions.',
      phone: '(214) 555-0170',
      website: null,
      call_script:
        'I received a notice that my SNAP is ending due to an income change I do not think is right. Can you help me appeal before the deadline?',
    },
  ],
  confidence: 'high',
  confidence_reason:
    'The letter clearly identifies a SNAP termination with a stated 10-day appeal window.',
  disclaimer:
    'ClearPath explains documents to help you understand your situation. It does not provide legal advice. If your situation is urgent, call 211 now.',
};

export const DISCHARGE = {
  document_type: 'Hospital Discharge Instructions',
  plain_explanation:
    'These are the instructions for taking care of yourself after surgery at home. They tell you which medicines to take, how to care for your wound, and when to see your doctor again. Following them carefully helps you heal and avoid going back to the hospital. The follow-up appointment is the most important step.',
  action_checklist: [
    {
      step: 1,
      action: 'Take your antibiotic twice a day until it is finished',
      deadline: null,
      urgency: 'immediate',
      detail: 'Do not stop early even if you feel better, or the infection can return.',
    },
    {
      step: 2,
      action: 'Go to your follow-up appointment',
      deadline: '7 days from discharge',
      urgency: 'this_week',
      detail: 'Your doctor needs to check that your wound is healing correctly.',
    },
    {
      step: 3,
      action: 'Call your doctor if you have a fever over 101F or the wound turns red',
      deadline: null,
      urgency: 'no_deadline',
      detail: 'These can be early signs of infection that need quick attention.',
    },
  ],
  resources: [
    {
      name: 'Nurse Advice Line',
      type: 'Health hotline',
      what_they_do:
        'A nurse can answer questions about your medicines and recovery 24/7.',
      phone: '(214) 555-0190',
      website: null,
      call_script:
        'I was just discharged after surgery and I have a question about my medication schedule and wound care.',
    },
    {
      name: '211',
      type: 'Community resource hotline',
      what_they_do:
        'Connects you to clinics, transportation, and prescription assistance.',
      phone: '211',
      website: 'https://www.211.org',
      call_script:
        'I just left the hospital after surgery and I need help getting to my follow-up appointment and affording my medication.',
    },
  ],
  confidence: 'high',
  confidence_reason:
    'The document is clearly post-surgical discharge instructions with explicit medication and follow-up steps.',
  disclaimer:
    'ClearPath explains documents to help you understand your situation. It does not provide legal advice. If your situation is urgent, call 211 now.',
};

export const SCHOOL = {
  document_type: 'School Attendance / Truancy Warning',
  plain_explanation:
    'This is a warning from your child’s school that says they have missed too many days. The school wants you to respond within 7 days and explain the absences. If you do not respond, the case can be referred to a truancy officer or court. Responding quickly shows the school you are taking it seriously.',
  action_checklist: [
    {
      step: 1,
      action: 'Respond to the school in writing within 7 days',
      deadline: '7 days from the date on this notice',
      urgency: 'this_week',
      detail: 'Explain the reason for the absences and ask about an attendance plan.',
    },
    {
      step: 2,
      action: 'Gather any doctor notes or proof for excused absences',
      deadline: null,
      urgency: 'this_week',
      detail: 'Documented reasons can change how absences are counted.',
    },
    {
      step: 3,
      action: 'Request a meeting with the school counselor',
      deadline: null,
      urgency: 'no_deadline',
      detail: 'A counselor can help set up support so this does not continue.',
    },
  ],
  resources: [
    {
      name: '211',
      type: 'Community resource hotline',
      what_they_do:
        'Connects families to school support, counseling, and parent advocacy.',
      phone: '211',
      website: 'https://www.211.org',
      call_script:
        'My child got a truancy warning from school and I have 7 days to respond. I need help understanding what to write and who can support us.',
    },
    {
      name: 'Parent Advocacy Line',
      type: 'Family education support',
      what_they_do:
        'Helps parents respond to school notices and understand their options.',
      phone: '(214) 555-0155',
      website: null,
      call_script:
        'I received an attendance warning for my child and I want to respond properly. Can you help me understand the process?',
    },
  ],
  confidence: 'medium',
  confidence_reason:
    'The notice is clearly a truancy warning, but specific local rules may affect the exact next steps.',
  disclaimer:
    'ClearPath explains documents to help you understand your situation. It does not provide legal advice. If your situation is urgent, call 211 now.',
};

export const UTILITY = {
  document_type: 'Utility Shutoff Notice',
  plain_explanation:
    'This notice says your electricity will be turned off in 5 days because of an unpaid bill. You can stop the shutoff by paying the amount due or setting up a payment plan. Many utilities also offer help programs if you cannot pay it all at once. Acting before the deadline keeps your power on.',
  action_checklist: [
    {
      step: 1,
      action: 'Call the utility company to set up a payment plan before the shutoff date',
      deadline: '5 days from the date on this notice',
      urgency: 'immediate',
      detail: 'A payment plan can stop the shutoff even if you cannot pay the full amount.',
    },
    {
      step: 2,
      action: 'Apply for utility assistance (LIHEAP)',
      deadline: null,
      urgency: 'this_week',
      detail: 'This program can help cover part of your energy bill.',
    },
    {
      step: 3,
      action: 'Ask whether you qualify for medical or weather protection from shutoff',
      deadline: null,
      urgency: 'no_deadline',
      detail: 'Some households cannot be shut off during certain conditions.',
    },
  ],
  resources: [
    {
      name: '211',
      type: 'Community resource hotline',
      what_they_do:
        'Connects you to utility assistance programs and emergency help.',
      phone: '211',
      website: 'https://www.211.org',
      call_script:
        'My electricity is going to be shut off in 5 days. I need help finding assistance and setting up a payment plan.',
    },
    {
      name: 'Utility Assistance (LIHEAP)',
      type: 'Energy bill assistance',
      what_they_do:
        'Helps low-income households pay heating and cooling bills.',
      phone: '(214) 555-0166',
      website: null,
      call_script:
        'I got a shutoff notice and I need to apply for energy bill assistance. Can you tell me if I qualify and how to apply quickly?',
    },
  ],
  confidence: 'high',
  confidence_reason:
    'The notice clearly states a 5-day disconnection date and lists payment options.',
  disclaimer:
    'ClearPath explains documents to help you understand your situation. It does not provide legal advice. If your situation is urgent, call 211 now.',
};

export const LOW_CONFIDENCE = {
  document_type: 'Unrecognized document',
  plain_explanation:
    'We could not clearly tell what this document is or what it is asking you to do. It may be incomplete, hard to read, or a type of document we are not sure about. Because getting this wrong could matter, we recommend talking to a real person before acting. Call 211 and they can help you understand it.',
  action_checklist: [
    {
      step: 1,
      action: 'Call 211 and describe the document you received',
      deadline: null,
      urgency: 'immediate',
      detail: 'A trained navigator can help identify the document and your next steps.',
    },
  ],
  resources: [
    {
      name: '211',
      type: 'Community resource hotline',
      what_they_do:
        'Free 24/7 help understanding documents and finding the right local resource.',
      phone: '211',
      website: 'https://www.211.org',
      call_script:
        'I received a document I do not understand and an app could not read it clearly. Can you help me figure out what it is and what I should do?',
    },
  ],
  confidence: 'low',
  confidence_reason:
    'The content was ambiguous or unreadable, so we cannot be certain about this interpretation.',
  disclaimer:
    'ClearPath explains documents to help you understand your situation. It does not provide legal advice. If your situation is urgent, call 211 now.',
};

export const MOCKS = {
  eviction: EVICTION,
  benefits: BENEFITS,
  discharge: DISCHARGE,
  school: SCHOOL,
  utility: UTILITY,
  low: LOW_CONFIDENCE,
};

/**
 * Pick a mock by keyword-matching the document text. Used only in MOCK mode so
 * the example chips and pasted sample text return a sensible analysis offline.
 */
export function pickMock(text = '') {
  const t = String(text).toLowerCase();
  if (!t.trim()) return LOW_CONFIDENCE;
  if (/(evict|vacate|unlawful detainer|cure or quit|writ of possession|landlord|lease)/.test(t))
    return EVICTION;
  if (/(snap|medicaid|benefit|food assistance|appeal|ssi|housing assistance)/.test(t))
    return BENEFITS;
  if (/(discharge|surgery|medication|hospital|wound|follow-up|prescri)/.test(t))
    return DISCHARGE;
  if (/(truancy|attendance|absences|school|student|principal)/.test(t))
    return SCHOOL;
  if (/(shutoff|shut off|disconnect|electric|utility|past due|power)/.test(t))
    return UTILITY;
  // Recognizable enough to attempt, but nothing matched cleanly.
  return t.length < 40 ? LOW_CONFIDENCE : EVICTION;
}
