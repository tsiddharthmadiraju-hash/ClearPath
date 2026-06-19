/** Synthetic demo documents (no real personal data). Same set as the web demo. */
export interface ExampleDoc {
  key: string;
  label: string;
  text: string;
}

export const EXAMPLES: ExampleDoc[] = [
  {
    key: 'eviction',
    label: 'Eviction Notice',
    text: `NOTICE TO VACATE
Date: June 13, 2026
To: Tenant, Unit 4B, 1820 Oak Street, Dallas, TX 75201

You are hereby notified that you are in default of your lease for non-payment of rent in the amount of $1,200.00. Pursuant to Texas Property Code Section 24.005, you are required to CURE the default or VACATE the premises within FIVE (5) DAYS of delivery of this notice. If you fail to pay the amount due or surrender possession within this period, the landlord will file an eviction suit (forcible detainer) and may obtain a writ of possession. You have the right to respond.

Landlord: Oakwood Property Management`,
  },
  {
    key: 'benefits',
    label: 'Benefits Letter',
    text: `NOTICE OF ADVERSE ACTION — SUPPLEMENTAL NUTRITION ASSISTANCE PROGRAM (SNAP)
Case #: 88-219-447  Date: June 12, 2026

This notice informs you that your SNAP benefits will be TERMINATED effective July 1, 2026 due to a reported change in household income exceeding program limits. You have the right to request a fair hearing (appeal). If you request a hearing within 10 days of the date of this notice, your benefits may continue unchanged until a decision is made. To appeal, contact your local benefits office.`,
  },
  {
    key: 'discharge',
    label: 'Hospital Discharge',
    text: `PATIENT DISCHARGE INSTRUCTIONS
Procedure: Laparoscopic appendectomy   Discharge date: June 14, 2026

MEDICATIONS: Take Amoxicillin 500mg by mouth twice daily for 7 days. Take Acetaminophen 500mg every 6 hours as needed for pain.
WOUND CARE: Keep incision sites clean and dry. Do not submerge in water for 7 days.
FOLLOW-UP: Return to the surgical clinic for follow-up on June 21, 2026.
CALL YOUR DOCTOR if you develop a fever over 101F, increasing redness, swelling, or drainage from the incision.`,
  },
  {
    key: 'school',
    label: 'School Notice',
    text: `NOTICE OF EXCESSIVE ABSENCES — ATTENDANCE WARNING
Student: [Minor]  Grade: 6  Date: June 11, 2026

Our records show your child has accumulated 12 unexcused absences this term, which exceeds the limit under state compulsory attendance law. You are required to respond to the school within 7 days to explain these absences and discuss an attendance improvement plan. Failure to respond may result in a referral to the truancy court. Please contact the attendance office.`,
  },
  {
    key: 'utility',
    label: 'Utility Shutoff',
    text: `NOTICE OF DISCONNECTION
Account: 5521-009834   Date: June 13, 2026
Service address: 1820 Oak Street, Unit 4B, Dallas, TX

Your electric service is scheduled for DISCONNECTION on June 18, 2026 due to a past-due balance of $284.57. To avoid disconnection, pay the balance in full or contact us to arrange a payment plan before the disconnection date. Payment assistance may be available for qualifying households. Contact customer service immediately.`,
  },
];
