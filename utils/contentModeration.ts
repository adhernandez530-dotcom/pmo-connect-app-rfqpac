
/**
 * Content Moderation Utility
 * Filters curse words, profanity, and negative/rude language
 */

// Comprehensive list of inappropriate words to filter
const INAPPROPRIATE_WORDS = [
  // Profanity and curse words
  'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'crap', 'piss',
  'bastard', 'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut',
  'fag', 'faggot', 'nigger', 'nigga', 'retard', 'retarded',
  
  // Variations and common misspellings
  'fck', 'fuk', 'f*ck', 'f**k', 'sh*t', 'sh!t', 'b!tch', 'a$$',
  'd*mn', 'h*ll', 'cr*p', 'p!ss', 'b*stard', 'd!ck', 'c*ck',
  'p*ssy', 'c*nt', 'wh*re', 'sl*t', 'f*g', 'n*gger', 'n*gga',
  
  // Negative/rude words
  'stupid', 'idiot', 'moron', 'dumb', 'loser', 'ugly', 'fat',
  'hate', 'kill', 'die', 'death', 'suicide', 'kys', 'stfu',
  'gtfo', 'trash', 'garbage', 'worthless', 'pathetic',
  
  // Offensive slurs and derogatory terms
  'chink', 'spic', 'wetback', 'gook', 'kike', 'towelhead',
  'cracker', 'honkey', 'redneck', 'hillbilly',
];

// Words that might be part of legitimate content (context-dependent)
const CONTEXT_SENSITIVE_WORDS = [
  'ass', 'hell', 'damn', 'crap', // Can be used in non-offensive contexts
];

/**
 * Escape special regex characters in a string
 * @param str - The string to escape
 * @returns Escaped string safe for use in RegExp
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if text contains inappropriate content
 * @param text - The text to check
 * @returns Object with isClean flag and list of found inappropriate words
 */
export function checkContent(text: string): {
  isClean: boolean;
  foundWords: string[];
  severity: 'none' | 'mild' | 'severe';
} {
  if (!text || typeof text !== 'string') {
    return { isClean: true, foundWords: [], severity: 'none' };
  }

  const lowerText = text.toLowerCase();
  const foundWords: string[] = [];
  let severity: 'none' | 'mild' | 'severe' = 'none';

  // Check for inappropriate words
  for (const word of INAPPROPRIATE_WORDS) {
    // Escape special regex characters to prevent "Nothing to repeat" errors
    const escapedWord = escapeRegExp(word);
    // Use word boundaries to avoid false positives (e.g., "class" containing "ass")
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
    if (regex.test(lowerText)) {
      foundWords.push(word);
      
      // Determine severity
      if (CONTEXT_SENSITIVE_WORDS.includes(word)) {
        severity = severity === 'none' ? 'mild' : severity;
      } else {
        severity = 'severe';
      }
    }
  }

  return {
    isClean: foundWords.length === 0,
    foundWords,
    severity,
  };
}

/**
 * Sanitize text by replacing inappropriate words with asterisks
 * @param text - The text to sanitize
 * @returns Sanitized text with inappropriate words replaced
 */
export function sanitizeContent(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let sanitized = text;

  for (const word of INAPPROPRIATE_WORDS) {
    // Escape special regex characters
    const escapedWord = escapeRegExp(word);
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    sanitized = sanitized.replace(regex, (match) => {
      // Replace with asterisks, keeping first letter
      return match[0] + '*'.repeat(match.length - 1);
    });
  }

  return sanitized;
}

/**
 * Get user-friendly error message based on severity
 * @param severity - The severity level
 * @returns User-friendly error message
 */
export function getModerationMessage(severity: 'none' | 'mild' | 'severe'): string {
  switch (severity) {
    case 'severe':
      return 'Your message contains inappropriate language. Please be respectful and avoid using offensive words.';
    case 'mild':
      return 'Please keep your language respectful and appropriate for all users.';
    default:
      return '';
  }
}

/**
 * Validate content before submission
 * @param text - The text to validate
 * @returns Object with validation result and error message
 */
export function validateContent(text: string): {
  isValid: boolean;
  errorMessage: string;
} {
  const { isClean, severity } = checkContent(text);

  if (!isClean) {
    return {
      isValid: false,
      errorMessage: getModerationMessage(severity),
    };
  }

  return {
    isValid: true,
    errorMessage: '',
  };
}
