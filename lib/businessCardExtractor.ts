/**
 * Business Card Extractor Utility
 * Extracts contact information from scanned business cards using OCR
 */

import { ocrEngine, OCRResult } from '@/lib/ocr/TesseractOCR';

// =====================================================
// TYPES
// =====================================================

export interface BusinessCardContact {
    name?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    title?: string;
    phones: string[];
    emails: string[];
    websites: string[];
    addresses: string[];
    socialMedia: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
    };
    rawText: string;
    confidence: number;
}

export interface ExtractionResult {
    success: boolean;
    contact: BusinessCardContact;
    error?: string;
}

// =====================================================
// REGEX PATTERNS
// =====================================================

const PATTERNS = {
    // Email pattern
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,

    // Phone patterns (international formats)
    phone: /(?:\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,

    // Website patterns
    website: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi,

    // LinkedIn
    linkedin: /(?:linkedin\.com\/in\/|linkedin:?\s*)([a-zA-Z0-9-]+)/gi,

    // Twitter/X
    twitter: /(?:twitter\.com\/|x\.com\/|@)([a-zA-Z0-9_]+)/gi,

    // Instagram
    instagram: /(?:instagram\.com\/|ig:?\s*@?)([a-zA-Z0-9._]+)/gi,

    // Facebook
    facebook: /(?:facebook\.com\/|fb\.com\/)([a-zA-Z0-9.]+)/gi,
};

// Common job titles for detection
const JOB_TITLES = [
    'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CIO',
    'Director', 'Manager', 'President', 'Vice President', 'VP',
    'Engineer', 'Developer', 'Designer', 'Architect',
    'Consultant', 'Analyst', 'Specialist', 'Coordinator',
    'Executive', 'Assistant', 'Secretary', 'Administrator',
    'Sales', 'Marketing', 'HR', 'Finance', 'Legal',
    'Senior', 'Junior', 'Lead', 'Head', 'Chief',
    'Founder', 'Co-Founder', 'Partner', 'Owner',
];

// =====================================================
// MAIN EXTRACTION FUNCTION
// =====================================================

export async function extractBusinessCard(imageUri: string): Promise<ExtractionResult> {
    try {
        // Run OCR on the image
        const ocrResult = await ocrEngine.recognizeText(imageUri, 'eng');

        // Extract contact info from OCR text
        const contact = parseContactInfo(ocrResult.text, ocrResult.confidence);

        return {
            success: true,
            contact,
        };
    } catch (error) {
        return {
            success: false,
            contact: createEmptyContact(),
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// =====================================================
// PARSING FUNCTIONS
// =====================================================

function parseContactInfo(text: string, confidence: number): BusinessCardContact {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    const contact: BusinessCardContact = {
        phones: [],
        emails: [],
        websites: [],
        addresses: [],
        socialMedia: {},
        rawText: text,
        confidence,
    };

    // Extract emails
    const emails = text.match(PATTERNS.email);
    if (emails) {
        contact.emails = [...new Set(emails.map(e => e.toLowerCase()))];
    }

    // Extract phones
    const phones = text.match(PATTERNS.phone);
    if (phones) {
        contact.phones = [...new Set(phones.map(p => cleanPhoneNumber(p)))].filter(p => p.length >= 7);
    }

    // Extract websites
    const websites = text.match(PATTERNS.website);
    if (websites) {
        contact.websites = [...new Set(websites
            .map(w => w.toLowerCase())
            .filter(w => !w.includes('@')) // Filter out emails
        )];
    }

    // Extract social media
    extractSocialMedia(text, contact);

    // Extract name and company from remaining lines
    extractNameAndCompany(lines, contact);

    // Extract title
    extractTitle(lines, contact);

    // Extract address (remaining lines with numbers and common address words)
    extractAddress(lines, contact);

    return contact;
}

function cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
}

function extractSocialMedia(text: string, contact: BusinessCardContact): void {
    const linkedinMatch = text.match(PATTERNS.linkedin);
    if (linkedinMatch) {
        contact.socialMedia.linkedin = linkedinMatch[0];
    }

    const twitterMatch = text.match(PATTERNS.twitter);
    if (twitterMatch) {
        const handle = twitterMatch[0];
        if (!handle.includes('@') || handle.startsWith('@')) {
            contact.socialMedia.twitter = handle;
        }
    }

    const instagramMatch = text.match(PATTERNS.instagram);
    if (instagramMatch) {
        contact.socialMedia.instagram = instagramMatch[0];
    }

    const facebookMatch = text.match(PATTERNS.facebook);
    if (facebookMatch) {
        contact.socialMedia.facebook = facebookMatch[0];
    }
}

function extractNameAndCompany(lines: string[], contact: BusinessCardContact): void {
    const usedLines: Set<number> = new Set();

    // Skip lines that are emails, phones, websites
    const contentLines = lines.filter((line, index) => {
        if (PATTERNS.email.test(line)) return false;
        if (PATTERNS.website.test(line)) return false;
        if (line.match(/[\d]{3,}/)) return false; // Lines with many digits
        return true;
    });

    // First non-contact line is usually the name
    if (contentLines.length > 0) {
        const nameLine = contentLines[0];
        const nameParts = nameLine.split(/\s+/);

        // Check if it looks like a name (2-4 words, no special chars)
        if (nameParts.length >= 1 && nameParts.length <= 5) {
            const isName = nameParts.every(part =>
                /^[A-Za-z'-]+$/.test(part) || /^[A-Z][a-z]+\.?$/.test(part)
            );

            if (isName) {
                contact.name = nameLine;
                if (nameParts.length >= 2) {
                    contact.firstName = nameParts[0];
                    contact.lastName = nameParts.slice(1).join(' ');
                } else {
                    contact.firstName = nameLine;
                }
                usedLines.add(0);
            }
        }
    }

    // Look for company name (usually follows name, often in caps or with Inc/LLC/Ltd)
    const companyPatterns = [
        /\b(?:Inc|LLC|Ltd|Corp|Co|Company|Corporation|Group|Holdings|Solutions|Technologies|Services)\b/i,
        /^[A-Z][A-Z\s&]+$/, // All caps company name
    ];

    for (let i = 0; i < contentLines.length; i++) {
        if (usedLines.has(i)) continue;

        const line = contentLines[i];
        const isCompany = companyPatterns.some(pattern => pattern.test(line));

        if (isCompany && !contact.company) {
            contact.company = line;
            break;
        }
    }

    // If no company found, check second line
    if (!contact.company && contentLines.length > 1 && !usedLines.has(1)) {
        const secondLine = contentLines[1];
        // If it's not a title and contains capital letters
        if (!JOB_TITLES.some(t => secondLine.toLowerCase().includes(t.toLowerCase()))) {
            contact.company = secondLine;
        }
    }
}

function extractTitle(lines: string[], contact: BusinessCardContact): void {
    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // Check if line contains a job title
        const hasTitle = JOB_TITLES.some(title =>
            lowerLine.includes(title.toLowerCase())
        );

        if (hasTitle) {
            // Make sure it's not the company name
            if (line !== contact.company) {
                contact.title = line;
                break;
            }
        }
    }
}

function extractAddress(lines: string[], contact: BusinessCardContact): void {
    const addressKeywords = [
        'street', 'st.', 'avenue', 'ave', 'road', 'rd', 'drive', 'dr',
        'boulevard', 'blvd', 'lane', 'ln', 'court', 'ct', 'way', 'plaza',
        'floor', 'suite', 'ste', 'building', 'bldg', 'tower',
        'jl.', 'jalan', // Indonesian
    ];

    const addressLines: string[] = [];

    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // Skip if it's already extracted
        if (line === contact.name || line === contact.company || line === contact.title) {
            continue;
        }

        // Check for address keywords or postal code pattern
        const hasAddressKeyword = addressKeywords.some(kw => lowerLine.includes(kw));
        const hasPostalCode = /\b\d{5}(?:-\d{4})?\b/.test(line);
        const hasStreetNumber = /^\d+\s+\w/.test(line);

        if (hasAddressKeyword || hasPostalCode || hasStreetNumber) {
            addressLines.push(line);
        }
    }

    if (addressLines.length > 0) {
        contact.addresses = [addressLines.join(', ')];
    }
}

function createEmptyContact(): BusinessCardContact {
    return {
        phones: [],
        emails: [],
        websites: [],
        addresses: [],
        socialMedia: {},
        rawText: '',
        confidence: 0,
    };
}

// =====================================================
// BUSINESS CARD DETECTION
// =====================================================

export function isBusinessCardSize(width: number, height: number): boolean {
    // Standard business card aspect ratio is approximately 1.75 (3.5" x 2")
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    return aspectRatio >= 1.5 && aspectRatio <= 2.0;
}

// =====================================================
// CONTACT FORMATTING
// =====================================================

export function formatContactForDisplay(contact: BusinessCardContact): string {
    const parts: string[] = [];

    if (contact.name) parts.push(`📛 ${contact.name}`);
    if (contact.title) parts.push(`💼 ${contact.title}`);
    if (contact.company) parts.push(`🏢 ${contact.company}`);
    if (contact.phones.length > 0) parts.push(`📱 ${contact.phones.join(', ')}`);
    if (contact.emails.length > 0) parts.push(`📧 ${contact.emails.join(', ')}`);
    if (contact.websites.length > 0) parts.push(`🌐 ${contact.websites.join(', ')}`);
    if (contact.addresses.length > 0) parts.push(`📍 ${contact.addresses.join(', ')}`);

    return parts.join('\n');
}

export function contactToVCard(contact: BusinessCardContact): string {
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
    ];

    if (contact.name) {
        lines.push(`FN:${contact.name}`);
        if (contact.firstName && contact.lastName) {
            lines.push(`N:${contact.lastName};${contact.firstName};;;`);
        }
    }

    if (contact.company) lines.push(`ORG:${contact.company}`);
    if (contact.title) lines.push(`TITLE:${contact.title}`);

    contact.phones.forEach(phone => {
        lines.push(`TEL;TYPE=WORK,VOICE:${phone}`);
    });

    contact.emails.forEach(email => {
        lines.push(`EMAIL;TYPE=WORK:${email}`);
    });

    contact.websites.forEach(website => {
        lines.push(`URL:${website}`);
    });

    contact.addresses.forEach(address => {
        lines.push(`ADR;TYPE=WORK:;;${address};;;;`);
    });

    lines.push('END:VCARD');

    return lines.join('\n');
}

export default {
    extractBusinessCard,
    isBusinessCardSize,
    formatContactForDisplay,
    contactToVCard,
};
