const PII_PATTERNS = {
  NAME: {
    patterns: [/name/i, /firstname/i, /lastname/i, /fullname/i],
    category: 'Name'
  },
  ADDRESS: {
    patterns: [/address/i, /street/i, /city/i, /state/i, /country/i, /zipcode/i, /postal/i],
    category: 'Address'
  },
  CONTACT: {
    patterns: [/phone/i, /mobile/i, /email/i, /contact/i],
    category: 'Contact Information'
  },
  FINANCIAL: {
    patterns: [/credit.*card/i, /card.*number/i, /cvv/i, /ccv/i, /payment/i, /bank/i, /account/i],
    category: 'Financial Information'
  },
  GOVERNMENT_ID: {
    patterns: [/ssn/i, /social.*security/i, /passport/i, /driver.*license/i, /national.*id/i, /tax.*id/i],
    category: 'Government ID'
  },
  HEALTH: {
    patterns: [/health/i, /medical/i, /patient/i, /prescription/i],
    category: 'Health Information'
  }
};

export const detectPIITypes = (apiPath: string): string[] => {
  const detectedTypes = new Set<string>();
  
  Object.entries(PII_PATTERNS).forEach(([_, pattern]) => {
    pattern.patterns.forEach(regex => {
      if (regex.test(apiPath)) {
        detectedTypes.add(pattern.category);
      }
    });
  });
  
  return Array.from(detectedTypes);
};