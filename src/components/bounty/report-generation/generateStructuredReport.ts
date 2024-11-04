export const generateStructuredReport = (summary: string, severity: string) => {
  // Extract steps to reproduce
  let steps: string[] = [];
  
  // Look for numbered steps (e.g., "1.", "2.", etc.)
  const numberedSteps = summary.match(/\d+\.\s*[^.!?]+[.!?]/g);
  if (numberedSteps) {
    steps = numberedSteps.map(step => step.trim());
  } else {
    // Look for sequential markers (first, then, next, finally, etc.)
    const sequentialMarkers = summary.match(/(?:first|then|next|after|finally)[^.!?]+[.!?]/gi);
    if (sequentialMarkers) {
      steps = sequentialMarkers.map(step => step.trim());
    } else {
      // If no explicit steps found, try to break into logical sequences
      steps = summary
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toLowerCase().includes("impact") && !s.toLowerCase().includes("proof"))
        .map((s, i) => `${i + 1}. ${s}`);
    }
  }

  // Extract impact - look for explicit impact statements first
  let impact = "";
  const impactPatterns = [
    /impact[^.!?]+[.!?]/i,
    /(?:results? in|leads? to|causes?|affects?|compromises?)[^.!?]+[.!?]/i,
    /(?:could|would|might|can|may)[^.!?]+[.!?]/i
  ];

  for (const pattern of impactPatterns) {
    const match = summary.match(pattern);
    if (match) {
      impact = match[0].trim();
      break;
    }
  }

  if (!impact) {
    impact = "Potential security impact needs to be assessed based on the provided information.";
  }

  // Look for proof of concept or references
  const proofPatterns = [
    /(?:proof|evidence|log|screenshot|attachment|reference)[^.!?]+[.!?]/i,
    /(?:demonstrated|shown|verified|confirmed)[^.!?]+[.!?]/i
  ];

  let proofOfConcept = "";
  for (const pattern of proofPatterns) {
    const match = summary.match(pattern);
    if (match) {
      proofOfConcept = match[0].trim();
      break;
    }
  }

  const recommendations = `Based on the identified ${severity} severity vulnerability, 
    we recommend conducting a thorough security assessment of the affected components and implementing 
    appropriate security controls to mitigate the risk.`;

  return {
    title: summary.split(/[.!?]/)[0].trim(),
    description: summary,
    steps_to_reproduce: steps.join("\n"),
    impact,
    proof_of_concept: proofOfConcept,
    recommendations,
    severity,
  };
};
