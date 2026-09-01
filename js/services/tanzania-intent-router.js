/* ==========================================================================
   SLCMS - Tanzania Legal Research Assistant
   Small-Talk, System-Help & CASE_LOOKUP Intent Routing Engine
   ========================================================================== */

const TanzaniaIntentRouter = {
  /**
   * Normalizes incoming user query for robust intent matching:
   * 1. Lowercases text
   * 2. Strips surrounding whitespace
   * 3. Normalizes internal spaces
   * 4. Strips simple punctuation while retaining keywords
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u017F]/g, ' ') // replace punctuation with space
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Normalize case names for fuzzy comparison:
   * - replaces 'vs', 'v.', 'v' with standard 'v'
   * - removes brackets, year markers, extra punctuation
   */
  normalizeCaseName(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/\[\d{4}\]/g, ' ')
      .replace(/\b(vs|v\.|v)\b/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Searches the Legal Source Library and Tanzania Precedents Repository for matching case records.
   * Understands variations like:
   * - "Abdallah Salum Muwinge vs Halima Ismail"
   * - "Abdallah Salum Muwinge v Halima Ismail"
   * - "Muwinge vs Halima"
   * - "[2020] TZHC 10045"
   * - "TZHC 10045"
   * - "10045"
   */
  findMatchingCaseRecord(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') return null;
    const clean = rawQuery.toLowerCase();
    const normQ = this.normalizeCaseName(rawQuery);
    const tokens = normQ.split(/\s+/).filter(w => w.length > 2 && !['want', 'know', 'about', 'tell', 'find', 'case', 'search', 'explain', 'what', 'happened', 'decided', 'ruling', 'show', 'nataka', 'kujua', 'kuhusu', 'nieleze', 'kesi', 'tafuta', 'judgment', 'judgement', 'hukumu'].includes(w));

    // Aggregate all library sources & judgments
    const allRecords = [];
    if (typeof SLCMS_STATE !== 'undefined') {
      if (Array.isArray(SLCMS_STATE.tanzaniaJudgments)) {
        allRecords.push(...SLCMS_STATE.tanzaniaJudgments);
      }
      if (Array.isArray(SLCMS_STATE.legalSourceDocuments)) {
        SLCMS_STATE.legalSourceDocuments.forEach(doc => {
          if (!allRecords.some(r => r.id === doc.id || r.title === doc.title)) {
            allRecords.push(doc);
          }
        });
      }
    }

    if (allRecords.length === 0) return null;

    // 1. Direct Citation / Case Number match (e.g. "10045", "TZHC 10045", "[2020] TZHC 10045", "tlr 6", "hcd 284")
    for (const rec of allRecords) {
      const cit = (rec.citation || '').toLowerCase();
      const num = (rec.caseNumber || '').toLowerCase();
      const title = (rec.title || '').toLowerCase();

      if (cit && clean.includes('10045') && cit.includes('10045')) return rec;
      if (num && clean.includes('10045') && num.includes('10045')) return rec;
      if (cit && clean.includes(cit)) return rec;
      if (num && clean.includes(num)) return rec;
    }

    // 2. Direct Party Names / Normalized Title match
    for (const rec of allRecords) {
      const normTitle = this.normalizeCaseName(rec.title || '');
      // If query contains the normalized title or vice versa
      if (normTitle && (normQ.includes(normTitle) || normTitle.includes(normQ))) {
        return rec;
      }

      // Check key party surname tokens (e.g. "muwinge" and "halima", "attilio" and "mbowe", "kibo", "bakhresa")
      if (tokens.length >= 2) {
        const matchesAllTokens = tokens.every(tok => normTitle.includes(tok) || (rec.citation || '').toLowerCase().includes(tok));
        if (matchesAllTokens) return rec;
      }

      // Single distinct landmark surname match
      const distinctSurnames = ['muwinge', 'attilio', 'nyagwaswa', 'bakhresa', 'mbowe', 'nyirabu'];
      for (const s of distinctSurnames) {
        if (clean.includes(s) && (normTitle.includes(s) || (rec.keywords || []).includes(s))) {
          return rec;
        }
      }
    }

    return null;
  },

  /**
   * Main Message Routing Entry Point
   * 
   * Strict Routing Order:
   * 1. Check greetings and small talk
   * 2. Check user identity
   * 3. Check CASE_LOOKUP and legal document queries
   * 4. Check SLCMS actions & help
   * 5. Check AI identity, capabilities, Tanzania legal scope
   * 6. Search uploaded legal documents and TanzLII library
   * 7. Return clarification ONLY if every search fails
   * 
   * @param {string} rawText
   * @returns {{ isSmallTalk: boolean, isLegal: boolean, intent: string, response?: string, category?: string, guidedOptions?: Array, matchedCase?: Object }}
   */
  routeMessage(rawText) {
    const clean = this.normalizeText(rawText);
    if (!clean) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'EMPTY',
        response: 'Please enter your Tanzanian legal question or greeting.',
        category: 'System'
      };
    }

    // Helper to attach default options if missing
    const wrapSmallTalk = (res) => {
      if (res && res.isSmallTalk && (!res.guidedOptions || res.guidedOptions.length === 0)) {
        res.guidedOptions = this.getDefaultGuidedOptions();
      }
      return res;
    };

    // 1. GREETING (e.g., "Hi", "Mambo", "Habari", "Shikamoo") - Only if not a case query
    const greetingMatch = this.checkGreeting(clean);
    if (greetingMatch && !this.findMatchingCaseRecord(rawText)) return wrapSmallTalk(greetingMatch);

    // 2. USER IDENTITY (e.g., "Do you know me?", "Who am I?")
    const userIdentityMatch = this.checkUserIdentity(clean);
    if (userIdentityMatch) return wrapSmallTalk(userIdentityMatch);

    // 3. CASE_LOOKUP & LEGAL DOCUMENT SEARCH (Priority Layer)
    const caseLookupMatch = this.checkCaseLookup(clean, rawText);
    if (caseLookupMatch) return caseLookupMatch;

    // 4. GENERAL CONVERSATION (HOW ARE YOU)
    const howAreYouMatch = this.checkHowAreYou(clean);
    if (howAreYouMatch) return wrapSmallTalk(howAreYouMatch);

    // 5. HELP & GUIDED OPTIONS
    const helpMatch = this.checkHelp(clean);
    if (helpMatch) return wrapSmallTalk(helpMatch);

    // 6. AI IDENTITY
    const identityMatch = this.checkIdentity(clean);
    if (identityMatch) return wrapSmallTalk(identityMatch);

    // 7. CAPABILITIES
    const capabilitiesMatch = this.checkCapabilities(clean);
    if (capabilitiesMatch) return wrapSmallTalk(capabilitiesMatch);

    // 8. HOW TO ASK
    const askingMatch = this.checkAskingQuestions(clean);
    if (askingMatch) return wrapSmallTalk(askingMatch);

    // 9. TANZANIA SCOPE
    const scopeMatch = this.checkTanzaniaScope(clean);
    if (scopeMatch) return wrapSmallTalk(scopeMatch);

    // 10. SOURCES
    const sourcesMatch = this.checkSources(clean);
    if (sourcesMatch) return wrapSmallTalk(sourcesMatch);

    // 11. UPLOADING DOCUMENTS
    const uploadMatch = this.checkUploadDocuments(clean);
    if (uploadMatch) return wrapSmallTalk(uploadMatch);

    // 12. ACCESS AND PERMISSIONS
    const accessMatch = this.checkAccessPermissions(clean);
    if (accessMatch) return wrapSmallTalk(accessMatch);

    // 13. LEGAL LIMITATIONS
    const limitationsMatch = this.checkLegalLimitations(clean);
    if (limitationsMatch) return wrapSmallTalk(limitationsMatch);

    // 14. NO RESULTS AND ERRORS
    const errorMatch = this.checkErrorsAndNoResults(clean);
    if (errorMatch) return wrapSmallTalk(errorMatch);

    // 15. APPRECIATION (THANKS)
    const thanksMatch = this.checkThanks(clean);
    if (thanksMatch) return wrapSmallTalk(thanksMatch);

    // 16. GOODBYE & CLOSING
    const goodbyeMatch = this.checkGoodbye(clean);
    if (goodbyeMatch) return wrapSmallTalk(goodbyeMatch);

    // 17. ACTUAL LEGAL RESEARCH QUESTION -> Route to TanzLII & Statutes search pipeline
    if (this.isLegalQuestion(clean, rawText)) {
      return {
        isSmallTalk: false,
        isLegal: true,
        intent: 'LEGAL_RESEARCH_QUESTION',
        category: 'Legal Research'
      };
    }

    // 18. UNKNOWN NON-LEGAL MESSAGE FALLBACK (Last Resort)
    return wrapSmallTalk({
      isSmallTalk: true,
      isLegal: false,
      intent: 'UNKNOWN_NON_LEGAL',
      response: 'I did not fully understand that request. You can ask me about Tanzanian judgments, legislation, document uploads, citations or SLCMS functions.',
      category: 'Clarification'
    });
  },

  getDefaultGuidedOptions() {
    return [
      { label: '📌 Temporary Injunctions', prompt: 'What principles are considered when granting a temporary injunction in Tanzania under Attilio v. Mbowe?' },
      { label: '📜 Breach of Contract', prompt: 'Explain breach of contract damages under Law of Contract Act Cap. 345' },
      { label: '🌳 Cases about Land', prompt: 'show me the cases about land' },
      { label: '🏛️ Case: Muwinge [2020]', prompt: 'I want to know about Abdallah Salum Muwinge vs Halima Ismail [2020] TZHC 10045' },
      { label: '👤 Do you know me?', prompt: 'Do you know me?' },
      { label: '📤 Upload Legal Document', action: 'openUploadModal' }
    ];
  },

  /* --------------------------------------------------------------------------
     CASE_LOOKUP INTENT (Requirement: Matches cases in Legal Source Library)
     -------------------------------------------------------------------------- */
  checkCaseLookup(clean, rawText) {
    const isLookupTrigger = /\b(i want to know about|tell me about|find the case|find case|find|search for|what happened in|what was decided in|what was the ruling in|what was the decision in|explain the case|explain case|summarize the judgment|summarize judgment|summarize the case|summarize case|summarize|show me the case|show me|show facts|show legal issues|show court reasoning|show final decision|show laws cited|do you know the case|do you know|nataka kujua kuhusu|nataka kujua|nieleze kesi ya|nieleze kesi|tafuta kesi ya|tafuta kesi|nini kilitokea kwenye kesi ya|nini kilitokea|mahakama iliamua nini kwenye|mahakama iliamua nini)\b/i.test(rawText);

    const matchedCase = this.findMatchingCaseRecord(rawText);

    // If no case matched and not a case trigger, return null to let other intents evaluate
    if (!matchedCase && !isLookupTrigger) return null;

    // If query matched a case record:
    if (matchedCase) {
      const caseTitle = matchedCase.title || 'Selected Case';
      const citation = matchedCase.citation ? ` ${matchedCase.citation}` : '';
      const fullCaseLabel = `${caseTitle}${citation}`;

      // Check if user specifically requested a direct action (e.g. "Summarize...", "Show facts...", "What was decided...")
      const isSpecificAction = /\b(summarize|muhtasari|facts|ukweli|issues|hoja|reasoning|sababu|decision|maamuzi|ruling|laws cited|sheria|hukumu)\b/i.test(clean);

      if (isSpecificAction) {
        // Route straight to legal search execution with pre-matched case context
        return {
          isSmallTalk: false,
          isLegal: true,
          intent: 'CASE_SPECIFIC_ANALYSIS',
          matchedCase: matchedCase,
          category: 'Case Analysis'
        };
      }

      // General discovery inquiry (e.g. "I want to know about Abdallah Salum Muwinge vs Halima Ismail", "Tell me about [case]", "Do you know [case]")
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CASE_LOOKUP',
        response: `I found <strong>${fullCaseLabel}</strong> in the Legal Source Library. What would you like to know?`,
        matchedCase: matchedCase,
        guidedOptions: [
          { label: '📑 Summarize the Case', prompt: `Summarize the judgment ${fullCaseLabel}` },
          { label: '📜 Show Facts', prompt: `Show facts of the case ${fullCaseLabel}` },
          { label: '⚖️ Show Legal Issues', prompt: `Show legal issues in ${fullCaseLabel}` },
          { label: '🧠 Show Court Reasoning', prompt: `Show court reasoning in ${fullCaseLabel}` },
          { label: '🏛️ Show Final Decision', prompt: `What was decided in ${fullCaseLabel}` },
          { label: '📖 Show Laws Cited', prompt: `Show laws cited in ${fullCaseLabel}` },
          { label: '🌐 Open Original Source', action: `viewFullPassage('${matchedCase.id}')` }
        ],
        category: 'Case Lookup'
      };
    }

    // Trigger phrase was used but no matching case was found in library
    if (isLookupTrigger) {
      return {
        isSmallTalk: false,
        isLegal: true,
        intent: 'LEGAL_RESEARCH_QUESTION',
        category: 'Legal Research'
      };
    }

    return null;
  },

  /* --------------------------------------------------------------------------
     1. GREETINGS (Personalized with session name if authenticated)
     -------------------------------------------------------------------------- */
  checkGreeting(clean) {
    const user = typeof SLCMS_STATE !== 'undefined' ? SLCMS_STATE.currentUser : null;
    const firstName = user?.name ? user.name.split(' ')[0] : '';

    if (/^(hi|hello|hey|hiya|howdy)\b/.test(clean) && !this.hasLegalTerms(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GREETING_HELLO',
        response: firstName 
          ? `Hello, ${firstName}! Welcome to the SLCMS Tanzania Legal Research Assistant. How may I assist you today?`
          : 'Hello! Welcome to the SLCMS Tanzania Legal Research Assistant. How may I assist you today?',
        category: 'Greeting'
      };
    }
    if (/^(mambo|mambo vipi|mambo zenu)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GREETING_MAMBO',
        response: firstName
          ? `Mambo, ${firstName}! Karibu kwenye SLCMS. Ninaweza kukusaidia kutafuta sheria na maamuzi ya mahakama za Tanzania.`
          : 'Mambo! Karibu kwenye SLCMS. Ninaweza kukusaidia kutafuta sheria na maamuzi ya mahakama za Tanzania.',
        category: 'Greeting'
      };
    }
    if (/^(habari|habari za leo|habari yako|habari za asubuhi|habari za mchana|habari za jioni)\b/.test(clean) && !this.hasLegalTerms(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GREETING_HABARI',
        response: firstName
          ? `Habari, ${firstName}! Karibu. Una swali gani kuhusu sheria au kesi za Tanzania?`
          : 'Habari! Karibu. Una swali gani kuhusu sheria au kesi za Tanzania?',
        category: 'Greeting'
      };
    }
    if (/^(hujambo|hujambo bwana|hujambo bibi)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GREETING_HUJAMBO',
        response: firstName
          ? `Sijambo, ${firstName}! Karibu kwenye SLCMS. Ninaweza kukusaidiaje?`
          : 'Sijambo! Karibu kwenye SLCMS. Ninaweza kukusaidiaje?',
        category: 'Greeting'
      };
    }
    if (/^(shikamoo|shikamooni)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GREETING_SHIKAMOO',
        response: 'Marahaba! Karibu kwenye SLCMS Tanzania Legal Research Assistant.',
        category: 'Greeting'
      };
    }
    if (/^(salama|salama kabisa|mko salama)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GREETING_SALAMA',
        response: 'Salama kabisa. Ninaweza kukusaidia kutafuta taarifa za kisheria za Tanzania.',
        category: 'Greeting'
      };
    }
    if (/^good\s*morning\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GREETING_GOOD_MORNING',
        response: firstName
          ? `Good morning, ${firstName}! How can I assist with your Tanzanian legal research today?`
          : 'Good morning! How can I assist with your Tanzanian legal research today?',
        category: 'Greeting'
      };
    }
    if (/^good\s*afternoon\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GREETING_GOOD_AFTERNOON',
        response: firstName
          ? `Good afternoon, ${firstName}! What Tanzanian legal information would you like to research?`
          : 'Good afternoon! What Tanzanian legal information would you like to research?',
        category: 'Greeting'
      };
    }
    if (/^good\s*evening\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GREETING_GOOD_EVENING',
        response: firstName
          ? `Good evening, ${firstName}! How may I assist you with your legal research?`
          : 'Good evening! How may I assist you with your legal research?',
        category: 'Greeting'
      };
    }
    if (/^(welcome|karibu)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GREETING_WELCOME',
        response: 'Thank you. Welcome to SLCMS, your source-based Tanzanian legal research assistant.',
        category: 'Greeting'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     2. USER IDENTITY (Dynamic based on authenticated session)
     -------------------------------------------------------------------------- */
  checkUserIdentity(clean) {
    const isSwahili = /\b(unajua mimi|unanijua|unajua jina langu|mimi ni nani|mimi nani|jina langu ni nani|jina langu nani|unanikumbuka)\b/.test(clean);
    const isEnglish = /\b(do you know me|do you remember me|who am i|who i am|what is my name|whats my name|what do you know about me|what you know about me|can you recognize me|have we met)\b/.test(clean);

    if (!isSwahili && !isEnglish) return null;

    const user = typeof SLCMS_STATE !== 'undefined' ? SLCMS_STATE.currentUser : null;

    if (!user || !user.name) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'USER_IDENTITY_UNAUTHENTICATED',
        response: isSwahili
          ? 'Sikufahamu utambulisho wako kwa sababu hujaingia kwenye mfumo. Tafadhali ingia kwa kutumia akaunti yako ya SLCMS iliyoidhinishwa.'
          : 'I do not know your identity because you are not signed in. Please sign in using your authorized SLCMS account.',
        category: 'User Identity'
      };
    }

    const fullName = user.name;
    const role = user.role || 'Authorized User';

    let responseText = '';
    if (isSwahili) {
      const roleMapSw = {
        'Administrator': 'Msimamizi wa Mfumo (Administrator)',
        'Lawyer': 'Wakili / Mwanasheria (Lawyer)',
        'Paralegal': 'Msaidizi wa Sheria (Paralegal)',
        'Client': 'Mteja (Client)'
      };
      const swRole = roleMapSw[role] || role;
      responseText = `Ninakutambua kama <strong>${fullName}</strong>, na umeingia kama <strong>${swRole}</strong>. Ninajua tu taarifa zilizopo kwenye akaunti yako ya SLCMS na rekodi ulizoruhusiwa kuzifikia. Sikujui binafsi nje ya mfumo huu.`;
    } else {
      const article = (role.toLowerCase().startsWith('a') || role.toLowerCase().startsWith('e') || role.toLowerCase().startsWith('i') || role.toLowerCase().startsWith('o')) ? 'an' : 'a';
      responseText = `I know you as <strong>${fullName}</strong>, signed in as ${article} <strong>${role}</strong>. I only know information available through your authorized SLCMS account and current conversation.`;
    }

    return {
      isSmallTalk: true,
      isLegal: false,
      intent: 'USER_IDENTITY',
      response: responseText,
      category: 'User Identity'
    };
  },

  /* --------------------------------------------------------------------------
     GENERAL CONVERSATION (HOW ARE YOU)
     -------------------------------------------------------------------------- */
  checkHowAreYou(clean) {
    if (/\b(how are you doing|how are you|how r u|how do you do)\b/.test(clean)) {
      if (clean.includes('doing')) {
        return {
          isSmallTalk: true,
          isLegal: false,
          intent: 'HOW_ARE_YOU_DOING',
          response: 'I am ready to help. You can ask me about Tanzanian judgments, legislation or authorized SLCMS case documents.',
          category: 'General'
        };
      }
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'HOW_ARE_YOU',
        response: 'I am functioning properly and ready to assist with Tanzanian legal research. How may I help you?',
        category: 'General'
      };
    }
    if (/\b(ukoje|hali gani|mzima|uko sawa)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'HOW_ARE_YOU_SW',
        response: 'Niko tayari kukusaidia. Unaweza kuniuliza kuhusu sheria au maamuzi ya mahakama za Tanzania.',
        category: 'General'
      };
    }
    if (/\b(vipi|vipi mambo|vipi hali)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'VIPI_SW',
        response: 'Nipo vizuri na niko tayari kukusaidia kufanya utafiti wa sheria za Tanzania.',
        category: 'General'
      };
    }
    if (/\b(are you working|is the system working|are you active|una fanya kazi)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ARE_YOU_WORKING',
        response: 'Yes. I am ready to search the Tanzanian legal materials available in SLCMS.',
        category: 'General'
      };
    }
    if (/\b(are you online|are you connected|uko online)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ARE_YOU_ONLINE',
        response: 'I am available. Access to original online sources depends on the system’s internet connection.',
        category: 'General'
      };
    }
    if (/\b(can we start|shall we start|tuanze|let us start)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAN_WE_START',
        response: 'Yes. Enter your Tanzanian legal question and I will search the available sources.',
        category: 'General'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     HELP & GUIDED ACTIONS
     -------------------------------------------------------------------------- */
  checkHelp(clean) {
    if (/\b(i need help|help me please|help me|yes help me|msaada please|nahitaji msaada|msaada)\b/.test(clean) && !this.hasLegalTerms(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'HELP_OPTIONS',
        response: `Certainly. What would you like to do?`,
        guidedOptions: [
          { label: '⚖️ Search Tanzanian Law', prompt: 'What principles are considered when granting a temporary injunction in Tanzania?' },
          { label: '🏛️ Find a Judgment', prompt: 'I want to know about Abdallah Salum Muwinge vs Halima Ismail [2020] TZHC 10045' },
          { label: '📑 Summarize a Document', prompt: 'Summarize the judgment Abdallah Salum Muwinge vs Halima Ismail [2020] TZHC 10045' },
          { label: '📤 Upload Legal Material', action: 'openUploadModal' },
          { label: '📁 Ask About an SLCMS Case', prompt: 'Which laws may apply to a land ownership dispute?' },
          { label: '📚 Learn How Citations Work', prompt: 'Why are citations important?' }
        ],
        category: 'Help'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     AI IDENTITY
     -------------------------------------------------------------------------- */
  checkIdentity(clean) {
    if (/\b(who are you|who are u)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'IDENTITY_WHO_ARE_YOU',
        response: 'I am the SLCMS Tanzania Legal Research Assistant. I help users search and understand available Tanzanian legal materials.',
        category: 'AI Identity'
      };
    }
    if (/\b(wewe ni nani|wewe nani)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'IDENTITY_WEWE_NI_NANI',
        response: 'Mimi ni SLCMS Tanzania Legal Research Assistant. Ninasaidia kutafuta na kueleza taarifa za kisheria za Tanzania.',
        category: 'AI Identity'
      };
    }
    if (/\b(what is your name|whats your name|jina lako nani|unaitwa nani)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'IDENTITY_NAME',
        response: 'My name is SLCMS Tanzania Legal Research Assistant.',
        category: 'AI Identity'
      };
    }
    if (/\b(are you a human|are you human|wewe ni binadamu)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'IDENTITY_HUMAN',
        response: 'No. I am an AI-assisted legal research system. My answers require verification by a legal professional.',
        category: 'AI Identity'
      };
    }
    if (/\b(are you a lawyer|are you an advocate|wewe ni mwanasheria|wewe ni wakili)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'IDENTITY_LAWYER',
        response: 'No. I am a legal research assistant and cannot replace a qualified lawyer.',
        category: 'AI Identity'
      };
    }
    if (/\b(are you tanzlii|wewe ni tanzlii)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'IDENTITY_TANZLII',
        response: 'No. I am an SLCMS assistant that can use selected TanzLII materials as legal sources.',
        category: 'AI Identity'
      };
    }
    if (/\b(do you work for tanzlii|unafanya kazi tanzlii)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'IDENTITY_WORK_FOR_TANZLII',
        response: 'No. SLCMS is not TanzLII and should not claim an official partnership without authorization.',
        category: 'AI Identity'
      };
    }
    if (/\b(who created you|who made you|nani aliyekuunda|who built you)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'IDENTITY_CREATOR',
        response: 'I was developed as part of the SLCMS project to support Tanzanian legal research and case management.',
        category: 'AI Identity'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     WHAT THE AI CAN DO (CAPABILITIES)
     -------------------------------------------------------------------------- */
  checkCapabilities(clean) {
    if (/\b(what can you do|what do you do|how can you help)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_WHAT_CAN_YOU_DO',
        response: 'I can search available Tanzanian legal materials, retrieve judgments, explain legal principles, summarize documents and provide source citations.',
        category: 'Capabilities'
      };
    }
    if (/\b(unaweza kufanya nini|unafanya nini)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_UNAWEZA_KUFANYA_NINI',
        response: 'Ninaweza kutafuta sheria na maamuzi ya mahakama za Tanzania, kufanya muhtasari na kuonyesha vyanzo.',
        category: 'Capabilities'
      };
    }
    if (/\b(can you find cases|unaweza kupata kesi|find cases)\b/.test(clean) && !this.isSpecificLegalQuery(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_FIND_CASES',
        response: 'Yes. Enter a case name, case number, court, year or legal subject.',
        category: 'Capabilities'
      };
    }
    if (/\b(can you search tanzlii|unaweza kutafuta tanzlii)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_SEARCH_TANZLII',
        response: 'I can search TanzLII materials that have been added to the SLCMS Legal Library and provide original TanzLII links.',
        category: 'Capabilities'
      };
    }
    if (/\b(can you summarize a judgment|can you summarize judgment|unaweza kufanya muhtasari wa hukumu)\b/.test(clean) && !this.isSpecificLegalQuery(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_SUMMARIZE_JUDGMENT',
        response: 'Yes. Select or upload the judgment, and I can prepare a source-based summary.',
        category: 'Capabilities'
      };
    }
    if (/\b(can you compare cases|unaweza kulinganisha kesi)\b/.test(clean) && !this.isSpecificLegalQuery(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_COMPARE_CASES',
        response: 'Yes. Provide or select the cases you want compared.',
        category: 'Capabilities'
      };
    }
    if (/\b(can you explain legislation|can you explain act|unaweza kueleza sheria)\b/.test(clean) && !this.isSpecificLegalQuery(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_EXPLAIN_LEGISLATION',
        response: 'Yes. I can explain retrieved Tanzanian legislation, but you must verify the current official text.',
        category: 'Capabilities'
      };
    }
    if (/\b(can you draft a legal document|can you draft|unaweza kuandika rasimu)\b/.test(clean) && !this.isSpecificLegalQuery(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_DRAFT',
        response: 'I can prepare an editable first draft using authorized information, but a legal professional must review it.',
        category: 'Capabilities'
      };
    }
    if (/\b(can you translate|unaweza kutafsiri|do you speak swahili)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_TRANSLATE',
        response: 'I can assist with English and Kiswahili explanations, but legal terminology must be professionally verified.',
        category: 'Capabilities'
      };
    }
    if (/\b(can you give citations|can you cite sources|unaweza kutoa nukuu)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_CITATIONS',
        response: 'Yes. Supported answers should include citations and links to the retrieved sources.',
        category: 'Capabilities'
      };
    }
    if (/\b(can you save my research|can i save research|unaweza kuhifadhi utafiti)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_SAVE_RESEARCH',
        response: 'Yes. Authorized users can save the question, answer and sources to an SLCMS case.',
        category: 'Capabilities'
      };
    }
    if (/\b(can you export the answer|can i export|can i download pdf|can i download docx)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CAPABILITY_EXPORT',
        response: 'Where enabled, you can export the research as PDF or DOCX.',
        category: 'Capabilities'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     TANZANIA-ONLY SCOPE
     -------------------------------------------------------------------------- */
  checkScope(clean) {
    if (/\b(which country do you cover|which countries do you cover|nchi gani unazohudumia)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SCOPE_COUNTRY',
        response: 'The first version of SLCMS focuses on Tanzania.',
        category: 'Tanzania Scope'
      };
    }
    if (/\b(do you know tanzanian law|unajua sheria za tanzania)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SCOPE_TANZANIAN_LAW',
        response: 'I can research Tanzanian law using the legal materials available in the SLCMS library.',
        category: 'Tanzania Scope'
      };
    }
    if (/\b(do you cover kenya|unahudumia kenya|what about kenya|kenya law)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SCOPE_KENYA',
        response: 'No. The first version is limited to Tanzania.',
        category: 'Tanzania Scope'
      };
    }
    if (/\b(do you cover all africa|do you cover uganda|do you cover uk|do you cover us)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SCOPE_ALL_AFRICA',
        response: 'No. The current system is Tanzania-focused. Other jurisdictions are outside its present scope.',
        category: 'Tanzania Scope'
      };
    }
    if (/\b(which courts do you search|what courts do you search|mahakama gani)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SCOPE_COURTS',
        response: 'I search available materials from Tanzanian courts and tribunals contained in the SLCMS Legal Library.',
        category: 'Tanzania Scope'
      };
    }
    if (/\b(what is your main source|what are your sources|chanzo chako kikuu)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SCOPE_MAIN_SOURCE',
        response: 'My primary public legal source is TanzLII, together with authorized Tanzanian materials uploaded to SLCMS.',
        category: 'Tanzania Scope'
      };
    }
    if (/\b(do you use foreign cases|foreign law|uk law|us law)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SCOPE_FOREIGN_CASES',
        response: 'Not by default. The first version uses Tanzanian authorities only.',
        category: 'Tanzania Scope'
      };
    }
    if (/\b(can you search court of appeal cases|court of appeal)\b/.test(clean) && !this.isSpecificLegalQuery(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SCOPE_COURT_OF_APPEAL',
        response: 'Yes, when relevant Court of Appeal of Tanzania judgments are available in the legal library.',
        category: 'Tanzania Scope'
      };
    }
    if (/\b(can you search high court cases|high court)\b/.test(clean) && !this.isSpecificLegalQuery(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SCOPE_HIGH_COURT',
        response: 'Yes, when the relevant High Court of Tanzania judgments have been indexed.',
        category: 'Tanzania Scope'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     ASKING LEGAL QUESTIONS
     -------------------------------------------------------------------------- */
  checkAskingQuestions(clean) {
    if (/\b(how do i ask a question|how to ask|how to search)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ASKING_HOW_TO_ASK',
        response: 'Enter the legal issue, case name, legislation or court decision you want to research. Include specific details where possible.',
        category: 'Usage'
      };
    }
    if (/\b(how should i write my question|how to phrase)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ASKING_HOW_TO_WRITE',
        response: 'Use a clear question such as: “What principles do Tanzanian courts apply when granting temporary injunctions?”',
        category: 'Usage'
      };
    }
    if (/\b(can i search by case number|search by case no)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ASKING_CASE_NUMBER',
        response: 'Yes. Enter the complete case number and, if possible, the court and year.',
        category: 'Usage'
      };
    }
    if (/\b(can i search by judge|search by judge)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ASKING_JUDGE',
        response: 'Yes, if judge information is available in the indexed documents.',
        category: 'Usage'
      };
    }
    if (/\b(can i search by year|search by year)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ASKING_YEAR',
        response: 'Yes. Use the year filter to limit the search results.',
        category: 'Usage'
      };
    }
    if (/\b(can i search by legal category|filter by category)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ASKING_CATEGORY',
        response: 'Yes. Select categories such as contract, land, employment, criminal or family law.',
        category: 'Usage'
      };
    }
    if (/\b(my question is long|is long question ok)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ASKING_LONG_QUESTION',
        response: 'That is acceptable, but clearly identify the principal legal issue you want researched.',
        category: 'Usage'
      };
    }
    if (/\b(can i ask a follow up|can i ask followup|followup question)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ASKING_FOLLOW_UP',
        response: 'Yes. Follow-up questions can continue using the authorities retrieved in the current research session.',
        category: 'Usage'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     SOURCES AND CITATIONS
     -------------------------------------------------------------------------- */
  checkSourcesAndCitations(clean) {
    if (/\b(where did you get this answer|what is your source|where did you get this)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SOURCES_WHERE_GET',
        response: 'The Sources section lists the judgments, legislation and authorized documents used for the answer.',
        category: 'Sources'
      };
    }
    if (/\b(show me the source|onyesha chanzo|show sources)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SOURCES_SHOW',
        response: 'Select a citation to open its source card and original link.',
        category: 'Sources'
      };
    }
    if (/\b(open the original case|open original source|fungua kesi ya asili)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SOURCES_OPEN_ORIGINAL',
        response: 'Select “Open Original Source” on the relevant source card.',
        category: 'Sources'
      };
    }
    if (/\b(why are citations important|why cite|kwa nini nukuu)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SOURCES_WHY_IMPORTANT',
        response: 'Citations allow you to verify that the explanation is supported by an actual legal authority.',
        category: 'Sources'
      };
    }
    if (/\b(is this citation correct|are citations correct)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SOURCES_IS_CORRECT',
        response: 'Open the original source and compare it with the statement. Report the citation if it does not support the answer.',
        category: 'Sources'
      };
    }
    if (/\b(what is tanzlii|tanzlii ni nini|explain tanzlii)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SOURCES_WHAT_IS_TANZLII',
        response: 'TanzLII is a Tanzanian legal information platform that publishes Tanzanian laws and judgments for public access.',
        category: 'Sources'
      };
    }
    if (/\b(can i trust every answer|can i trust you|is ai trustworthy)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SOURCES_CAN_I_TRUST',
        response: 'No AI answer should be accepted without verification. Always examine the cited original sources.',
        category: 'Sources'
      };
    }
    if (/\b(why did you provide no citation|why no citation|kwa nini hakuna nukuu)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SOURCES_NO_CITATION',
        response: 'A legal answer without a supporting source should not be treated as verified. Try another search or add relevant materials.',
        category: 'Sources'
      };
    }
    if (/\b(the citation is wrong|citation error|wrong citation|nukuu si sahihi)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'SOURCES_CITATION_WRONG',
        response: 'Select “Report Incorrect Citation,” identify the citation and explain the problem.',
        category: 'Sources'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     UPLOADING DOCUMENTS
     -------------------------------------------------------------------------- */
  checkUploadDocuments(clean) {
    if (/\b(can i upload a document|can i upload|unaweza kupakia nyaraka)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'UPLOAD_CAN_I',
        response: 'Yes, if you are authorized to use it. Open the Legal Source Library and select “Upload Legal Material.”',
        category: 'Documents'
      };
    }
    if (/\b(which files can i upload|supported file formats|what file types)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'UPLOAD_WHICH_FILES',
        response: 'The system can accept supported PDF, DOCX and TXT files. Scanned documents may require OCR.',
        category: 'Documents'
      };
    }
    if (/\b(why is my document processing|document indexing|kwa nini inachakata)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'UPLOAD_WHY_PROCESSING',
        response: 'The system is extracting and indexing its text. It becomes searchable when its status changes to “Ready for AI.”',
        category: 'Documents'
      };
    }
    if (/\b(why can t the ai read my pdf|why cant the ai read my pdf|cannot read pdf)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'UPLOAD_CANNOT_READ_PDF',
        response: 'The PDF may contain scanned images instead of readable text. Apply OCR and upload it again.',
        category: 'Documents'
      };
    }
    if (/\b(what does ready for ai mean|ready for ai)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'UPLOAD_READY_FOR_AI',
        response: 'The document has been successfully processed and can now be searched by the assistant.',
        category: 'Documents'
      };
    }
    if (/\b(can i upload a confidential document|confidential file)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'UPLOAD_CONFIDENTIAL',
        response: 'Only if you are authorized and its access is restricted to the relevant case or users. Use anonymized documents for demonstrations.',
        category: 'Documents'
      };
    }
    if (/\b(can i remove an uploaded document|delete uploaded document)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'UPLOAD_REMOVE',
        response: 'Authorized users can remove or archive documents according to their permissions.',
        category: 'Documents'
      };
    }
    if (/\b(can i upload a tanzlii judgment|upload tanzlii case)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'UPLOAD_TANZLII_JUDGMENT',
        response: 'Yes, for the educational prototype, while preserving TanzLII attribution and its original source link.',
        category: 'Documents'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     ACCESS AND PERMISSIONS
     -------------------------------------------------------------------------- */
  checkAccessPermissions(clean) {
    if (/\b(can i view every case|can i see all cases)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ACCESS_EVERY_CASE',
        response: 'No. You can access only cases permitted by your role and case assignment.',
        category: 'Access'
      };
    }
    if (/\b(can i view another lawyer s case|can i view another lawyers case|other lawyer case)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ACCESS_ANOTHER_LAWYER',
        response: 'Only if you have been given permission to access it.',
        category: 'Access'
      };
    }
    if (/\b(why is access denied|access denied|permission denied|sina ruhusa)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ACCESS_DENIED',
        response: 'Your account does not have permission to access that record or function. Contact the administrator if necessary.',
        category: 'Access'
      };
    }
    if (/\b(why must i log in|why login|kwa nini niingie)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ACCESS_WHY_LOGIN',
        response: 'Authentication protects confidential cases, clients, documents and research activities.',
        category: 'Access'
      };
    }
    if (/\b(i am not registered|not registered|sijasajiliwa)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ACCESS_NOT_REGISTERED',
        response: 'Access is limited to accounts created or approved by the SLCMS administrator.',
        category: 'Access'
      };
    }
    if (/\b(can a public user enter|public access|mtu wa kawaida)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ACCESS_PUBLIC_USER',
        response: 'No. SLCMS is an internal law-firm system and does not allow unrestricted public access.',
        category: 'Access'
      };
    }
    if (/\b(is my research private|is search private|utafiti ni siri)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ACCESS_RESEARCH_PRIVATE',
        response: 'Research involving restricted cases should only be accessible to authorized users.',
        category: 'Access'
      };
    }
    if (/\b(who can manage the legal library|manage library)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ACCESS_MANAGE_LIBRARY',
        response: 'Administrators and other users granted document-management permission.',
        category: 'Access'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     LEGAL LIMITATIONS
     -------------------------------------------------------------------------- */
  checkLegalLimitations(clean) {
    if (/\b(will i win my case|am i going to win|nitashinda kesi)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'LIMITATION_WILL_I_WIN',
        response: 'I cannot guarantee a case outcome. I can retrieve relevant authorities for professional review.',
        category: 'Legal Limitations'
      };
    }
    if (/\b(is the accused guilty|is he guilty|is she guilty|ana hatia)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'LIMITATION_IS_GUILTY',
        response: 'I cannot determine guilt. That decision belongs to the court after considering the evidence and applicable law.',
        category: 'Legal Limitations'
      };
    }
    if (/\b(what will the judge decide|what will court decide|jaji ataamua nini)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'LIMITATION_WHAT_JUDGE_DECIDE',
        response: 'I cannot predict a judge’s final decision. I can show relevant Tanzanian authorities.',
        category: 'Legal Limitations'
      };
    }
    if (/\b(give me final legal advice|give legal advice|ushauri wa mwisho)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'LIMITATION_FINAL_ADVICE',
        response: 'I can provide source-based research assistance, but final legal advice must come from a qualified legal professional.',
        category: 'Legal Limitations'
      };
    }
    if (/\b(is this law still valid|is statute valid|sheria bado inatumika)\b/.test(clean) && !this.isSpecificLegalQuery(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'LIMITATION_LAW_VALID',
        response: 'I must retrieve a current official source before confirming its legal status. Please verify the latest official version.',
        category: 'Legal Limitations'
      };
    }
    if (/\b(are you always correct|do you make mistakes|uko sahihi kila mara)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'LIMITATION_ALWAYS_CORRECT',
        response: 'No. AI-generated information may contain errors. Verify every important statement against the cited source.',
        category: 'Legal Limitations'
      };
    }
    if (/\b(why did you refuse to answer|why did you refuse|kwa nini umekataa)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'LIMITATION_WHY_REFUSE',
        response: 'I could not find sufficient verified information or the request was outside my permitted function.',
        category: 'Legal Limitations'
      };
    }
    if (/\b(just guess the answer|can you guess|buni tu)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'LIMITATION_JUST_GUESS',
        response: 'I should not guess legal information. I can answer only when sufficient supporting sources are available.',
        category: 'Legal Limitations'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     NO RESULTS AND ERRORS
     -------------------------------------------------------------------------- */
  checkErrorsAndNoResults(clean) {
    if (/\b(no cases were found|no results found|hakuna kesi zilizopatikana)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ERROR_NO_CASES',
        response: 'Try changing the keywords, removing filters or searching by legal subject, court or year.',
        category: 'Troubleshooting'
      };
    }
    if (/\b(you did not answer my question|you didnt answer|hukujibu swali)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ERROR_DID_NOT_ANSWER',
        response: 'I may not have found sufficient supporting material. Try rewriting the question or adding a relevant document.',
        category: 'Troubleshooting'
      };
    }
    if (/\b(the system is slow|why so slow|mfumo ni wa polepole)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ERROR_SYSTEM_SLOW',
        response: 'The system may be searching and processing several legal documents. Please wait or try again.',
        category: 'Troubleshooting'
      };
    }
    if (/\b(something went wrong|system error|kuna hitilafu)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ERROR_SOMETHING_WRONG',
        response: 'I could not complete the request. Please try again or contact the administrator if the problem continues.',
        category: 'Troubleshooting'
      };
    }
    if (/\b(the server is unavailable|server down|seva haipatikani)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ERROR_SERVER_UNAVAILABLE',
        response: 'The SLCMS service is temporarily unavailable. Confirm that the local Java, database and AI services are running.',
        category: 'Troubleshooting'
      };
    }
    if (/\b(the original link is not opening|link not opening|tanzlii link broken)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ERROR_LINK_NOT_OPENING',
        response: 'Check the internet connection or search for the case directly on TanzLII.',
        category: 'Troubleshooting'
      };
    }
    if (/\b(my session expired|session timed out|muda umeisha)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ERROR_SESSION_EXPIRED',
        response: 'Sign in again to continue securely. Unsaved information may need to be entered again.',
        category: 'Troubleshooting'
      };
    }
    if (/\b(i uploaded the wrong document|uploaded wrong file|nimepakia vibaya)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'ERROR_UPLOADED_WRONG',
        response: 'If you have permission, remove it from the library and upload the correct document.',
        category: 'Troubleshooting'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     APPRECIATION (THANKS)
     -------------------------------------------------------------------------- */
  checkThanks(clean) {
    if (/\b(asante sana|shukrani sana)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'THANKS_ASANTE_SANA',
        response: 'Karibu sana. Ninaweza kukusaidia na swali lingine kuhusu sheria za Tanzania.',
        category: 'Appreciation'
      };
    }
    if (/\b(asante|shukrani)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'THANKS_ASANTE',
        response: 'Karibu! Kumbuka kuthibitisha majibu kwa kutumia vyanzo vilivyoonyeshwa.',
        category: 'Appreciation'
      };
    }
    if (/\b(thanks a lot|thank you very much|thank you)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'THANKS_THANK_YOU',
        response: 'You’re welcome. Remember to verify the answer using the cited sources.',
        category: 'Appreciation'
      };
    }
    if (/\b(thanks|thx)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'THANKS_THANKS',
        response: 'You’re welcome! Is there another Tanzanian legal question you would like to research?',
        category: 'Appreciation'
      };
    }
    if (/\b(good job|great job|well done|kazi nzuri)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'THANKS_GOOD_JOB',
        response: 'Thank you. Please verify the generated research against the original sources.',
        category: 'Appreciation'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     GOODBYE & CLOSING
     -------------------------------------------------------------------------- */
  checkGoodbye(clean) {
    if (/^(okay|ok|sawa|haya)\b/.test(clean) && clean.split(' ').length <= 3) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'CLOSING_OKAY',
        response: 'Sawa. Niko tayari unapokuwa na swali lingine.',
        category: 'Closing'
      };
    }
    if (/\b(tutaonana|tutaonana baadaye|kwaheri)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GOODBYE_TUTAONANA',
        response: 'Tutaonana! Karibu tena unapohitaji msaada wa utafiti wa sheria za Tanzania.',
        category: 'Closing'
      };
    }
    if (/\b(goodbye|farewell)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GOODBYE_FORMAL',
        response: 'Goodbye. Your saved research will remain available according to your account permissions.',
        category: 'Closing'
      };
    }
    if (/\b(bye|bye bye|see you)\b/.test(clean)) {
      return {
        isSmallTalk: true,
        isLegal: false,
        intent: 'GOODBYE_BYE',
        response: 'Goodbye! Return whenever you need source-based Tanzanian legal research.',
        category: 'Closing'
      };
    }
    return null;
  },

  /* --------------------------------------------------------------------------
     LEGAL RESEARCH QUERY RECOGNITION HELPERS
     -------------------------------------------------------------------------- */
  hasLegalTerms(clean) {
    const legalRegex = /\b(injunction|contract|breach|damages|land|occupancy|title|deed|probate|custody|bail|murder|theft|appeal|revision|tribunal|cap\b|tlr|tzca|tzhc|order\s+[xvi]+|section\s+\d+|act\b|statute|precedent|jurisdiction|ratio|obiter|affidavit|plaint|chamber\s+summons|notice\s+of\s+motion|attilio|nyagwaswa|kibo|gonzaga|mbowe|muwinge|halima|ismail|10045)\b/i;
    return legalRegex.test(clean);
  },

  isSpecificLegalQuery(clean) {
    return this.hasLegalTerms(clean);
  },

  isLegalQuestion(clean, raw) {
    if (this.hasLegalTerms(clean)) return true;

    const legalQueryPattern = /\b(what|which|how|find|compare|summarize|explain|cite|when|can|is|does|who|where|tell)\b.*\b(law|legal|court|judgment|case|ruling|decree|statute|act|section|rule|judge|appeal|remedy|right|claim|liability|dispute|tenant|landlord|employer|employee|estate|probate|heir|spouse)\b/i;
    if (legalQueryPattern.test(clean)) return true;

    if (/(\[\d{4}\]|cap\.\s*\d+|tzca|tzhc|hcd\s*\d+|\d{4,5})/i.test(raw)) return true;

    return false;
  }
};
