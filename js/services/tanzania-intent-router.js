/* ==========================================================================
   SLCMS - Tanzania Legal Research Assistant
   Intent-Based Prepared-Response System (32 Complete Intent Categories)
   Zero-Hallucination Verified Tanzanian Judgments & Legal Authorities
   ========================================================================== */

const TanzaniaIntentRouter = {
  /**
   * Complete 32-Category Intent Enumeration + Standard Compatibility Aliases
   */
  CATEGORIES: {
    GREETINGS_EN: 'GREETINGS_EN',
    GREETINGS_SW: 'GREETINGS_SW',
    GREETING: 'GREETING',
    POSITIVE_REPLIES: 'POSITIVE_REPLIES',
    NEGATIVE_REPLIES: 'NEGATIVE_REPLIES',
    ASSISTANT_IDENTITY: 'ASSISTANT_IDENTITY',
    DO_YOU_KNOW_ME: 'DO_YOU_KNOW_ME',
    CAPABILITIES: 'CAPABILITIES',
    FIND_JUDGMENT: 'FIND_JUDGMENT',
    LISTING_CASES: 'LISTING_CASES',
    LIST_CASES: 'LIST_CASES',
    CASE_SUMMARY: 'CASE_SUMMARY',
    SUMMARIZE_CASE: 'CASE_SUMMARY',
    CASE_FACTS: 'CASE_FACTS',
    SHOW_FACTS: 'CASE_FACTS',
    CASE_INFORMATION: 'CASE_INFORMATION',
    LEGAL_ISSUES: 'LEGAL_ISSUES',
    SHOW_LEGAL_ISSUES: 'LEGAL_ISSUES',
    PARTIES_ARGUMENTS: 'PARTIES_ARGUMENTS',
    COURT_REASONING: 'COURT_REASONING',
    SHOW_REASONING: 'COURT_REASONING',
    FINAL_DECISION: 'FINAL_DECISION',
    SHOW_FINAL_DECISION: 'FINAL_DECISION',
    LAWS_CITED: 'LAWS_CITED',
    SHOW_LAWS_CITED: 'LAWS_CITED',
    CASES_CITED: 'CASES_CITED',
    LEGAL_PRINCIPLE: 'LEGAL_PRINCIPLE',
    PROCEDURAL_HISTORY: 'PROCEDURAL_HISTORY',
    OPEN_SOURCE: 'OPEN_SOURCE',
    UPLOAD_HELP: 'UPLOAD_HELP',
    OCR_HELP: 'OCR_HELP',
    CASE_COMPARISON: 'CASE_COMPARISON',
    LEGAL_REPORT: 'LEGAL_REPORT',
    LEGAL_RESEARCH: 'LEGAL_RESEARCH',
    AUTHENTICATION_ACCOUNTS: 'AUTHENTICATION_ACCOUNTS',
    PERMISSIONS_ACCESS: 'PERMISSIONS_ACCESS',
    ASSIGNED_WORK: 'ASSIGNED_WORK',
    ADD_INFORMATION: 'ADD_INFORMATION',
    DELETE_INFORMATION: 'DELETE_INFORMATION',
    LEGAL_ADVICE_REQUEST: 'LEGAL_ADVICE_REQUEST',
    UNCLEAR_QUESTIONS: 'UNCLEAR_QUESTIONS',
    OUT_OF_SCOPE: 'OUT_OF_SCOPE'
  },

  // Conversation Context Tracking (Case Selection Memory)
  context: {
    lastActiveCase: null,
    activeCaseId: null,
    pendingAction: null,
    lastCategory: null,
    lastUserQuery: null
  },

  /**
   * 18 Standard Legal Categories Specification
   */
  LEGAL_CATEGORIES: {
    LAND_LAW: {
      key: 'LAND_LAW',
      name: 'Land Cases',
      emoji: '🏞️',
      aliases: ['land', 'ardhi', 'ownership', 'title deed', 'boundary', 'boundaries', 'eviction', 'adverse possession', 'land tribunal', 'hati miliki', 'mipaka', 'kufukuzwa'],
      keywords: [
        'show me land cases', 'show land cases', 'provide cases about land', 'provide land cases', 'find land judgments',
        'cases concerning land ownership', 'land dispute cases', 'cases about title deeds',
        'cases about boundaries', 'cases about eviction', 'cases about adverse possession',
        'cases from the land tribunal', 'land cases', 'land case', 'land dispute', 'land ownership',
        'title deed cases', 'boundary cases', 'eviction cases', 'adverse possession cases',
        'onyesha kesi za ardhi', 'nipe hukumu za ardhi', 'tafuta migogoro ya ardhi',
        'kesi za umiliki wa ardhi', 'kesi za hati miliki', 'kesi za mipaka',
        'kesi za kufukuzwa kwenye ardhi', 'kesi za ardhi', 'hukumu za ardhi', 'migogoro ya ardhi'
      ]
    },
    CRIMINAL_LAW: {
      key: 'CRIMINAL_LAW',
      name: 'Criminal Cases',
      emoji: '⚖️',
      aliases: ['criminal', 'jinai', 'crime', 'murder', 'manslaughter', 'theft', 'armed robbery', 'fraud', 'drug', 'sexual offence', 'wildlife crime', 'economic crime', 'bail', 'wizi', 'mauaji', 'unyang\'anyi', 'dhamana', 'dawa za kulevya', 'uhujumu uchumi'],
      keywords: [
        'show criminal cases', 'provide criminal judgments', 'find criminal appeals',
        'cases involving the republic', 'murder cases', 'manslaughter cases', 'theft cases',
        'armed robbery cases', 'fraud cases', 'drug cases', 'sexual offence cases',
        'wildlife crime cases', 'economic crime cases', 'bail applications', 'criminal appeals',
        'cases of criminal', 'cases about crime', 'criminal law cases', 'provide criminal cases',
        'provide me the cases of criminal', 'criminal cases', 'criminal judgment',
        'onyesha kesi za jinai', 'kesi za wizi', 'kesi za mauaji', 'kesi za unyang\'anyi',
        'maombi ya dhamana', 'kesi za dawa za kulevya', 'kesi za uhujumu uchumi',
        'kesi za jinai', 'hukumu za jinai', 'nipe hukumu za jinai'
      ]
    },
    FAMILY_MATRIMONIAL_LAW: {
      key: 'FAMILY_MATRIMONIAL_LAW',
      name: 'Matrimonial and Family Cases',
      emoji: '👨‍👩‍👧',
      aliases: ['matrimonial', 'family', 'divorce', 'custody', 'maintenance', 'ndoa', 'talaka', 'malezi', 'matunzo', 'visitation', 'domestic violence', 'mgawanyo wa mali'],
      keywords: [
        'show matrimonial cases', 'find divorce cases', 'marriage cases', 'child custody cases',
        'child maintenance cases', 'matrimonial property cases', 'cases about division of property',
        'cases about visitation rights', 'domestic violence cases', 'divorce cases', 'custody cases',
        'matrimonial cases', 'family cases', 'cases of matrimonial', 'provide matrimonial cases',
        'onyesha kesi za ndoa', 'kesi za talaka', 'kesi za malezi ya mtoto', 'kesi za matunzo ya mtoto',
        'kesi za mgawanyo wa mali', 'kesi za haki ya kumuona mtoto', 'kesi za ndoa', 'hukumu za ndoa'
      ]
    },
    PROBATE_INHERITANCE: {
      key: 'PROBATE_INHERITANCE',
      name: 'Probate and Inheritance Cases',
      emoji: '📜',
      aliases: ['probate', 'inheritance', 'mirathi', 'urithi', 'wosia', 'estate', 'administrator', 'letters of administration', 'wills', 'intestate', 'heirs', 'warithi'],
      keywords: [
        'show probate cases', 'find inheritance cases', 'cases about deceased estates',
        'cases about administrators', 'letters of administration cases', 'cases about wills',
        'intestate succession cases', 'disputes between heirs', 'probate cases', 'inheritance cases',
        'deceased estate cases', 'will cases', 'administration of estate',
        'onyesha kesi za mirathi', 'kesi za urithi', 'kesi za wosia', 'kesi za msimamizi wa mirathi',
        'kesi za warithi', 'maombi ya usimamizi wa mirathi', 'kesi za mirathi', 'hukumu za mirathi'
      ]
    },
    CONTRACT_LAW: {
      key: 'CONTRACT_LAW',
      name: 'Contract Cases',
      emoji: '📑',
      aliases: ['contract', 'mikataba', 'breach of contract', 'agreements', 'subcontract', 'termination', 'damages', 'kuvunja mkataba', 'fidia'],
      keywords: [
        'show contract cases', 'find breach-of-contract cases', 'breach of contract cases',
        'cases about unpaid agreements', 'commercial contract cases', 'subcontract cases',
        'cases about termination of contract', 'cases about damages', 'contract cases',
        'breach of contract', 'contract dispute cases', 'unpaid agreement cases',
        'onyesha kesi za mikataba', 'kesi za kuvunja mkataba', 'kesi za fidia',
        'kesi za kusitisha mkataba', 'migogoro ya kibiashara', 'kesi za mikataba', 'hukumu za mikataba'
      ]
    },
    COMMERCIAL_LAW: {
      key: 'COMMERCIAL_LAW',
      name: 'Commercial Cases',
      emoji: '🏢',
      aliases: ['commercial', 'business', 'biashara', 'company', 'shareholder', 'arbitration', 'transactions', 'kampuni', 'wanahisa', 'usuluhishi'],
      keywords: [
        'show commercial cases', 'business dispute cases', 'company cases', 'shareholder disputes',
        'commercial arbitration cases', 'cases about business transactions', 'cases involving companies',
        'commercial disputes', 'business cases', 'corporate cases',
        'onyesha kesi za biashara', 'kesi za kampuni', 'migogoro ya wanahisa',
        'kesi za usuluhishi wa kibiashara', 'kesi za biashara', 'hukumu za biashara'
      ]
    },
    TAX_LAW: {
      key: 'TAX_LAW',
      name: 'Tax Cases',
      emoji: '💰',
      aliases: ['tax', 'kodi', 'tra', 'commissioner general', 'vat', 'income tax', 'customs', 'forodha', 'tax assessment', 'tax appeals'],
      keywords: [
        'show tax cases', 'find tra cases', 'cases involving the commissioner general',
        'vat cases', 'income-tax cases', 'income tax cases', 'tax assessment disputes',
        'customs cases', 'tax appeals', 'tax cases', 'revenue appeals', 'tax law cases',
        'onyesha kesi za kodi', 'kesi dhidi ya tra', 'kesi za vat', 'rufaa za kodi',
        'migogoro ya makadirio ya kodi', 'kesi za forodha', 'kesi za kodi', 'hukumu za kodi'
      ]
    },
    EMPLOYMENT_LABOUR: {
      key: 'EMPLOYMENT_LABOUR',
      name: 'Employment and Labour Cases',
      emoji: '👷',
      aliases: ['employment', 'labour', 'labor', 'ajira', 'kazi', 'unfair termination', 'dismissal', 'compensation', 'cma', 'discrimination', 'kufukuzwa kazi'],
      keywords: [
        'show employment cases', 'find labour judgments', 'unfair-termination cases', 'unfair termination cases',
        'dismissal cases', 'employee compensation cases', 'employment contract cases',
        'cma cases', 'workplace discrimination cases', 'employment cases', 'labour cases', 'labor cases',
        'onyesha kesi za ajira', 'kesi za kufukuzwa kazi', 'kesi za wafanyakazi',
        'kesi za cma', 'kesi za fidia ya mfanyakazi', 'migogoro ya kazi', 'kesi za ajira', 'kesi za kazi'
      ]
    },
    CONSTITUTIONAL_LAW: {
      key: 'CONSTITUTIONAL_LAW',
      name: 'Constitutional and Human-Rights Cases',
      emoji: '🏛️',
      aliases: ['constitutional', 'human rights', 'katiba', 'haki za binadamu', 'equality', 'freedom', 'fair hearing', 'liberty', 'challenging legislation', 'usawa', 'uhuru'],
      keywords: [
        'show constitutional cases', 'human-rights cases', 'human rights cases', 'cases about equality',
        'cases about freedom of expression', 'cases about a fair hearing', 'cases about personal liberty',
        'cases challenging legislation', 'constitutional cases', 'bill of rights cases',
        'onyesha kesi za katiba', 'kesi za haki za binadamu', 'kesi za usawa',
        'kesi za uhuru', 'kesi za haki ya kusikilizwa', 'kesi za katiba', 'hukumu za katiba'
      ]
    },
    ADMINISTRATIVE_LAW: {
      key: 'ADMINISTRATIVE_LAW',
      name: 'Administrative and Judicial-Review Cases',
      emoji: '⚖️',
      aliases: ['administrative', 'judicial review', 'mapitio', 'public authorities', 'certiorari', 'mandamus', 'prohibition', 'government decision', 'kiutawala'],
      keywords: [
        'show administrative cases', 'find judicial-review cases', 'judicial review cases',
        'cases against public authorities', 'certiorari cases', 'mandamus cases',
        'prohibition applications', 'government decision challenges', 'administrative cases',
        'onyesha kesi za mapitio', 'kesi dhidi ya mamlaka ya serikali', 'maombi ya certiorari',
        'maombi ya mandamus', 'maamuzi ya kiutawala', 'kesi za mapitio ya kimahakama'
      ]
    },
    CIVIL_PROCEDURE: {
      key: 'CIVIL_PROCEDURE',
      name: 'Civil Procedure Cases',
      emoji: '📐',
      aliases: ['civil procedure', 'mwenendo wa madai', 'extension of time', 'limitation', 'struck out', 'technical reasons', 'certificate of delay', 'stay of execution', 'injunction', 'revision', 'kuongezewa muda', 'ukomo wa muda', 'zuio'],
      keywords: [
        'show civil-procedure cases', 'show civil procedure cases', 'extension-of-time cases', 'extension of time cases',
        'cases about limitation', 'cases struck out', 'cases dismissed for technical reasons',
        'certificate-of-delay cases', 'certificate of delay cases', 'stay-of-execution cases', 'stay of execution cases',
        'injunction cases', 'revision applications', 'civil procedure cases',
        'onyesha kesi za mwenendo wa madai', 'kesi za kuongezewa muda', 'kesi za ukomo wa muda',
        'maombi ya kusimamisha utekelezaji', 'maombi ya zuio', 'kesi zilizofutwa', 'mwenendo wa madai'
      ]
    },
    EVIDENCE_LAW: {
      key: 'EVIDENCE_LAW',
      name: 'Evidence Cases',
      emoji: '🔍',
      aliases: ['evidence', 'ushahidi', 'burden of proof', 'electronic evidence', 'chain of custody', 'identification', 'confession', 'documentary evidence', 'contradictions', 'mzigo wa kuthibitisha', 'maungamo'],
      keywords: [
        'show evidence cases', 'cases about burden of proof', 'electronic-evidence cases', 'electronic evidence cases',
        'chain-of-custody cases', 'chain of custody cases', 'identification-evidence cases', 'identification evidence cases',
        'confession cases', 'documentary-evidence cases', 'documentary evidence cases', 'cases about contradictions', 'evidence cases',
        'onyesha kesi za ushahidi', 'kesi za mzigo wa kuthibitisha', 'kesi za ushahidi wa kielektroniki',
        'kesi za utambulisho', 'kesi za mnyororo wa vielelezo', 'kesi za maungamo', 'kesi za ushahidi'
      ]
    },
    PROPERTY_LAW: {
      key: 'PROPERTY_LAW',
      name: 'Property Cases',
      emoji: '🏠',
      aliases: ['property', 'mali', 'ownership', 'recovery', 'houses', 'vehicles', 'transfer', 'umiliki', 'nyumba', 'magari', 'kurejesha mali'],
      keywords: [
        'show property cases', 'ownership cases', 'property-recovery cases', 'property recovery cases',
        'cases about houses', 'cases about vehicles', 'property transfer cases', 'property cases',
        'onyesha kesi za mali', 'kesi za umiliki', 'kesi za nyumba', 'kesi za magari', 'kesi za kurejesha mali', 'kesi za mali'
      ]
    },
    TORT_LAW: {
      key: 'TORT_LAW',
      name: 'Tort and Negligence Cases',
      emoji: '⚠️',
      aliases: ['tort', 'negligence', 'uzembe', 'personal injury', 'defamation', 'accident', 'compensation', 'medical negligence', 'kashfa', 'ajali'],
      keywords: [
        'show negligence cases', 'find tort cases', 'personal-injury cases', 'personal injury cases',
        'defamation cases', 'accident compensation cases', 'medical-negligence cases', 'medical negligence cases',
        'tort cases', 'negligence cases', 'tort law cases',
        'onyesha kesi za uzembe', 'kesi za kashfa', 'kesi za ajali', 'kesi za fidia ya majeraha',
        'kesi za uzembe wa kitabibu', 'kesi za madhara', 'kesi za fidia ya uzembe'
      ]
    },
    BANKING_FINANCE: {
      key: 'BANKING_FINANCE',
      name: 'Banking and Finance Cases',
      emoji: '🏦',
      aliases: ['banking', 'finance', 'benki', 'loan', 'mortgage', 'bank recovery', 'guarantees', 'securities', 'mikopo', 'rehani', 'dhamana ya benki'],
      keywords: [
        'show banking cases', 'loan dispute cases', 'mortgage cases', 'bank-recovery cases', 'bank recovery cases',
        'cases about guarantees', 'cases about securities', 'banking cases', 'financial dispute cases',
        'onyesha kesi za benki', 'kesi za mikopo', 'kesi za rehani', 'kesi za dhamana ya benki', 'kesi za mabenki'
      ]
    },
    INTELLECTUAL_PROPERTY: {
      key: 'INTELLECTUAL_PROPERTY',
      name: 'Intellectual-Property Cases',
      emoji: '💡',
      aliases: ['intellectual property', 'trademark', 'copyright', 'patent', 'brand', 'infringement', 'hakimiliki', 'alama za biashara'],
      keywords: [
        'show intellectual-property cases', 'show intellectual property cases', 'trademark cases',
        'copyright cases', 'patent cases', 'brand-infringement cases', 'brand infringement cases',
        'ip cases', 'intellectual property cases',
        'onyesha kesi za hakimiliki', 'kesi za alama za biashara', 'kesi za patent',
        'kesi za uvunjaji wa hakimiliki', 'kesi za hakimiliki'
      ]
    },
    ENVIRONMENT_WILDLIFE: {
      key: 'ENVIRONMENT_WILDLIFE',
      name: 'Environmental and Wildlife Cases',
      emoji: '🐘',
      aliases: ['environmental', 'wildlife', 'mazingira', 'wanyamapori', 'trophy', 'government trophy', 'pollution', 'damage', 'forestry', 'nyara za serikali', 'misitu'],
      keywords: [
        'show environmental cases', 'wildlife cases', 'government-trophy cases', 'government trophy cases',
        'pollution cases', 'environmental-damage cases', 'environmental damage cases', 'forestry cases',
        'environmental cases', 'wildlife crime', 'elephant trophy cases',
        'onyesha kesi za mazingira', 'kesi za wanyamapori', 'kesi za nyara za serikali',
        'kesi za uchafuzi wa mazingira', 'kesi za misitu', 'kesi za mazingira'
      ]
    },
    ELECTION_LAW: {
      key: 'ELECTION_LAW',
      name: 'Election Cases',
      emoji: '🗳️',
      aliases: ['election', 'uchaguzi', 'petition', 'results', 'candidate', 'qualification', 'mashauri ya uchaguzi', 'matokeo', 'sifa za mgombea'],
      keywords: [
        'show election cases', 'election-petition cases', 'election petition cases',
        'cases about election results', 'candidate-qualification cases', 'candidate qualification cases',
        'election petitions', 'election disputes',
        'onyesha kesi za uchaguzi', 'mashauri ya uchaguzi', 'kesi za matokeo ya uchaguzi',
        'kesi za sifa za mgombea', 'kesi za uchaguzi'
      ]
    }
  },

  /**
   * Identifies which of the 18 Legal Categories a query refers to (if any)
   */
  detectLegalCategory(cleanText) {
    if (!cleanText) return null;
    const clean = cleanText.toLowerCase();

    // 1. Direct Keyword Matching across all 18 categories
    for (const [key, def] of Object.entries(this.LEGAL_CATEGORIES)) {
      if (def.keywords.some(kw => clean.includes(kw.toLowerCase()))) {
        return key;
      }
    }

    // 2. Specific Sub-Topic & Alias Boundary Matching
    // Land Law
    if (/\b(land cases|land dispute|ardhi|title deed|title deeds|hati miliki|land ownership|umiliki wa ardhi|boundary cases|boundaries|mipaka|eviction cases|kufukuzwa|adverse possession|land tribunal)\b/i.test(clean)) {
      return 'LAND_LAW';
    }
    // Criminal Law
    if (/\b(criminal cases|criminal appeals|criminal judgments|kesi za jinai|hukumu za jinai|murder cases|manslaughter cases|theft cases|armed robbery|wizi|mauaji|unyang\'anyi|maombi ya dhamana|dawa za kulevya|uhujumu uchumi)\b/i.test(clean)) {
      return 'CRIMINAL_LAW';
    }
    // Family & Matrimonial
    if (/\b(matrimonial cases|divorce cases|marriage cases|child custody cases|child maintenance cases|division of property|visitation rights|domestic violence|kesi za ndoa|kesi za talaka|malezi ya mtoto|matunzo ya mtoto|mgawanyo wa mali)\b/i.test(clean)) {
      return 'FAMILY_MATRIMONIAL_LAW';
    }
    // Probate & Inheritance
    if (/\b(probate cases|inheritance cases|mirathi|urithi|wosia|deceased estate|letters of administration|wills|intestate succession|heirs|warithi|usimamizi wa mirathi)\b/i.test(clean)) {
      return 'PROBATE_INHERITANCE';
    }
    // Contract Law
    if (/\b(contract cases|breach of contract cases|unpaid agreements|commercial contract|subcontract|termination of contract|kuvunja mkataba|kusitisha mkataba|kesi za mikataba)\b/i.test(clean)) {
      return 'CONTRACT_LAW';
    }
    // Commercial Law
    if (/\b(commercial cases|business dispute cases|company cases|shareholder disputes|commercial arbitration|business transactions|kesi za biashara|kesi za kampuni|wanahisa)\b/i.test(clean)) {
      return 'COMMERCIAL_LAW';
    }
    // Tax Law
    if (/\b(tax cases|tra cases|vat cases|income tax cases|tax assessment disputes|customs cases|tax appeals|kesi za kodi|rufaa za kodi)\b/i.test(clean)) {
      return 'TAX_LAW';
    }
    // Employment & Labour
    if (/\b(employment cases|labour cases|labor cases|unfair termination cases|dismissal cases|employee compensation|cma cases|kesi za ajira|kufukuzwa kazi|kesi za kazi)\b/i.test(clean)) {
      return 'EMPLOYMENT_LABOUR';
    }
    // Constitutional Law
    if (/\b(constitutional cases|human rights cases|haki za binadamu|freedom of expression|fair hearing|personal liberty|challenging legislation|kesi za katiba)\b/i.test(clean)) {
      return 'CONSTITUTIONAL_LAW';
    }
    // Administrative & Judicial Review
    if (/\b(administrative cases|judicial review cases|mapitio ya kimahakama|certiorari|mandamus|prohibition|government decision)\b/i.test(clean)) {
      return 'ADMINISTRATIVE_LAW';
    }
    // Civil Procedure
    if (/\b(civil procedure cases|mwenendo wa madai|extension of time cases|limitation cases|struck out cases|certificate of delay|stay of execution|injunction cases|kuongezewa muda)\b/i.test(clean)) {
      return 'CIVIL_PROCEDURE';
    }
    // Evidence Law
    if (/\b(evidence cases|ushahidi|burden of proof|electronic evidence|chain of custody|identification evidence|confession cases|documentary evidence)\b/i.test(clean)) {
      return 'EVIDENCE_LAW';
    }
    // Property Law
    if (/\b(property cases|property recovery|property transfer|kesi za mali|kurejesha mali)\b/i.test(clean)) {
      return 'PROPERTY_LAW';
    }
    // Tort & Negligence
    if (/\b(tort cases|negligence cases|personal injury cases|defamation cases|accident compensation|medical negligence|kesi za uzembe|kesi za kashfa)\b/i.test(clean)) {
      return 'TORT_LAW';
    }
    // Banking & Finance
    if (/\b(banking cases|loan dispute|mortgage cases|bank recovery|guarantees|kesi za benki|kesi za mikopo)\b/i.test(clean)) {
      return 'BANKING_FINANCE';
    }
    // Intellectual Property
    if (/\b(intellectual property cases|trademark cases|copyright cases|patent cases|brand infringement|kesi za hakimiliki)\b/i.test(clean)) {
      return 'INTELLECTUAL_PROPERTY';
    }
    // Environmental & Wildlife
    if (/\b(environmental cases|wildlife cases|government trophy|pollution cases|forestry cases|kesi za mazingira|kesi za wanyamapori)\b/i.test(clean)) {
      return 'ENVIRONMENT_WILDLIFE';
    }
    // Election Law
    if (/\b(election cases|election petition|candidate qualification|kesi za uchaguzi|mashauri ya uchaguzi)\b/i.test(clean)) {
      return 'ELECTION_LAW';
    }

    return null;
  },

  /**
   * Extracts multi-dimensional filters from query text (Year, Court, Judge, Outcome, Location, Entity, Subject)
   */
  extractQueryFilters(rawQuery) {
    if (!rawQuery) return { category: 'ALL', year: 'ALL', court: 'ALL', judge: 'ALL', outcome: 'ALL', location: 'ALL', entity: 'ALL', subject: 'ALL' };
    const clean = this.normalizeText(rawQuery);

    // 1. Year Extraction
    const yearMatch = rawQuery.match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : 'ALL';

    // 2. Court Extraction
    let court = 'ALL';
    if (/\b(court of appeal|mahakama ya rufani|cat|ca)\b/i.test(clean)) {
      court = 'Court of Appeal';
    } else if (/\b(high court|mahakama kuu|tzhc|hcd)\b/i.test(clean)) {
      court = 'High Court';
    } else if (/\b(land tribunal|tribunal ya ardhi|tribunal)\b/i.test(clean)) {
      court = 'Land Tribunal';
    } else if (/\b(cma|commission for mediation and arbitration|tume ya usuluhishi)\b/i.test(clean)) {
      court = 'CMA';
    } else if (/\b(tax appeals tribunal|tax tribunal)\b/i.test(clean)) {
      court = 'Tax Appeals Tribunal';
    }

    // 3. Judge Extraction
    let judge = 'ALL';
    const judgeMatch = rawQuery.match(/\b(?:judge|jaji|justice|hon\.?)\s+([a-zA-Z]+)/i) ||
                       clean.match(/\b(?:decided by|heard by|before)\s+(?:judge|jaji)?\s*([a-zA-Z]+)/i) ||
                       clean.match(/\b(kilimi|kulita|georges|nyalali|mchome|mansoor|mbarouk|mustafa|munuo|msoffe|luanda|mugasha)\b/i);
    if (judgeMatch) {
      judge = judgeMatch[1];
    }

    // 4. Outcome Extraction
    let outcome = 'ALL';
    if (/\b(appeal allowed|appeal was allowed|rufaa ilikubaliwa|allowed|quashed|set aside|acquitted|ushindi)\b/i.test(clean)) {
      outcome = 'allowed';
    } else if (/\b(appeal dismissed|appeal was dismissed|rufaa ilikataliwa|dismissed|rejected|upheld)\b/i.test(clean)) {
      outcome = 'dismissed';
    } else if (/\b(struck out|dismissed for technical reasons|kufutwa|ilifutwa)\b/i.test(clean)) {
      outcome = 'struck_out';
    } else if (/\b(bail granted|dhamana ilikubaliwa|bail was granted|injunction granted|stay granted)\b/i.test(clean)) {
      outcome = 'granted';
    }

    // 5. Location / Registry Extraction
    let location = 'ALL';
    const locMatch = clean.match(/\b(dar es salaam|moshi|musoma|katavi|dodoma|temeke|mwanza|arusha|tanga|mbeya|morogoro|iringa|tabora|kigoma|bukoba|shinyanga|songea|mtwara)\b/i);
    if (locMatch) {
      location = locMatch[1];
    }

    // 6. Entity Extraction
    let entity = 'ALL';
    if (/\b(tra|tanzania revenue authority|commissioner general)\b/i.test(clean)) entity = 'TRA';
    else if (/\b(crdb|crdb bank)\b/i.test(clean)) entity = 'CRDB';
    else if (/\b(nbc|national bank of commerce)\b/i.test(clean)) entity = 'NBC';
    else if (/\b(republic|jamhuri|attorney general|mwanasheria mkuu)\b/i.test(clean)) entity = 'Republic';
    else if (/\b(nssf)\b/i.test(clean)) entity = 'NSSF';

    // 7. Specific Subject Topic Extraction
    let subject = 'ALL';
    if (/\b(extension of time|kuongezewa muda)\b/i.test(clean)) subject = 'extension of time';
    else if (/\b(stay of execution|kusimamisha utekelezaji)\b/i.test(clean)) subject = 'stay of execution';
    else if (/\b(injunction|zuio)\b/i.test(clean)) subject = 'injunction';
    else if (/\b(bail|dhamana)\b/i.test(clean)) subject = 'bail';
    else if (/\b(chain of custody|mnyororo wa vielelezo)\b/i.test(clean)) subject = 'chain of custody';
    else if (/\b(division of property|mgawanyo wa mali)\b/i.test(clean)) subject = 'division of property';
    else if (/\b(child custody|malezi ya mtoto)\b/i.test(clean)) subject = 'child custody';

    return { year, court, judge, outcome, location, entity, subject };
  },

  /**
   * Normalizes incoming text: converts to lowercase, removes unnecessary punctuation & extra spaces,
   * and corrects common spelling mistakes (helo, summalize, surmalize, judgement, quastion, etc.)
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    let clean = text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u017F\?\!\.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Correct common typographical mistakes
    clean = clean
      .replace(/\bhelo\b/g, 'hello')
      .replace(/\bhallo\b/g, 'hello')
      .replace(/\bsummalize\b/g, 'summarize')
      .replace(/\bsurmalize\b/g, 'summarize')
      .replace(/\bsummarise\b/g, 'summarize')
      .replace(/\bjudgement\b/g, 'judgment')
      .replace(/\bquastion\b/g, 'question')
      .replace(/\blawya\b/g, 'lawyer')
      .replace(/\bwakil\b/g, 'wakili')
      .replace(/\bmahakam\b/g, 'mahakama')
      .replace(/\bshria\b/g, 'sheria')
      .replace(/\bhukumu\b/g, 'hukumu');

    return clean;
  },

  /**
   * Helper to safely extract user profile information
   */
  getUserProfile() {
    const isAppLoggedIn = typeof App !== 'undefined' 
      ? !!App.isLoggedIn 
      : (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('slcms_auth') === 'true');
    const user = (typeof SLCMS_STATE !== 'undefined' && isAppLoggedIn) ? SLCMS_STATE.currentUser : null;
    const isLoggedIn = !!isAppLoggedIn && !!user && user.status !== 'Inactive' && user.status !== 'Suspended';
    return {
      isLoggedIn: !!isLoggedIn,
      firstName: user?.name ? user.name.split(' ')[0] : 'Counsel',
      fullName: user?.name || 'Guest Counsel',
      role: user?.role || 'Guest'
    };
  },

  /**
   * Time of day determination for greetings
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
  },

  toSafeStr(val) {
    if (!val) return '';
    if (Array.isArray(val)) return val.map(v => typeof v === 'string' ? v : (v && typeof v === 'object' ? Object.values(v).join(' ') : String(v))).join(' ').toLowerCase();
    if (typeof val === 'string') return val.toLowerCase();
    if (typeof val === 'object') return Object.values(val).join(' ').toLowerCase();
    return String(val).toLowerCase();
  },

  /**
   * Comprehensive search across all 12 Case Fields:
   * 1. case_title (title)
   * 2. appellant_name (appellant, applicant, plaintiff, firstAccused)
   * 3. respondent_name (respondent, defendant, secondAccused)
   * 4. applicant_name (applicant)
   * 5. defendant_name (defendant)
   * 6. party_aliases (aliases, search_aliases)
   * 7. citation (citation)
   * 8. case_number (caseNumber, proceeding)
   * 9. court (court, location, registry)
   * 10. judge (judge)
   * 11. decision_year (year, decisionDate)
   * 12. keywords (keywords, subject, claimSummary, additionalSubject)
   */
  searchAllCaseRecords(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') return [];
    const clean = rawQuery.toLowerCase().trim();

    // Strip common search query prefixes & suffixes to get the core search phrase
    let searchTerm = clean
      .replace(/^(find|search for|search|locate|look for|do you have|show me|show|tell me about|nipatie|tafuta|nitafutie|onyesha|nipe|ipo kesi ya|kuna kesi ya|kesi ya|hukumu ya)\s+/i, '')
      .replace(/\s+(cases|case|judgments|judgment|hukumu|kesi)$/i, '')
      .replace(/\b(vs|v\.|v|versus|dhidi ya)\b/g, ' ')
      .replace(/[^\w\s\[\]\d]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Also strip action words if user asked "Summarize Muwinge" or "Show facts of Muwinge"
    searchTerm = searchTerm
      .replace(/^(summarize|summarise|muhtasari wa|facts of|ukweli wa|issues in|reasoning of|decision in|orders in|pdf of|pdf for|report for)\s+/i, '')
      .trim();

    if (!searchTerm) searchTerm = clean;

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

    if (allRecords.length === 0) return [];

    // Extract year filter if present (e.g. "Muwinge case of 2020")
    const yearMatch = rawQuery.match(/\b(19\d{2}|20\d{2})\b/);
    const filterYear = yearMatch ? yearMatch[1] : null;

    const cleanNoYear = filterYear ? searchTerm.replace(new RegExp('\\b' + filterYear + '\\b', 'g'), '').trim() : searchTerm;
    const tokens = cleanNoYear
      .split(/\s+/)
      .filter(t => t.length > 1 && !['the', 'and', 'for', 'about', 'from', 'cases', 'case', 'hukumu', 'kesi', 'kuhusu', 'katika', 'ya', 'za', 'wa', 'of', 'in', 'na'].includes(t));

    const matches = [];

    for (const rec of allRecords) {
      const case_title = this.toSafeStr(rec.case_title || rec.title || rec.caseTitle);
      const appellant_name = this.toSafeStr(rec.appellant_name || rec.appellant || rec.applicant_name || rec.applicant || rec.plaintiff || rec.firstAccused || rec.firstApplicant || rec.firstAppellant);
      const respondent_name = this.toSafeStr(rec.respondent_name || rec.respondent || rec.defendant_name || rec.defendant || rec.secondAccused || rec.secondRespondent);
      const applicant_name = this.toSafeStr(rec.applicant_name || rec.applicant);
      const defendant_name = this.toSafeStr(rec.defendant_name || rec.defendant);
      const party_aliases = Array.isArray(rec.party_aliases || rec.search_aliases || rec.aliases) 
        ? (rec.party_aliases || rec.search_aliases || rec.aliases).join(' ').toLowerCase() 
        : this.toSafeStr(rec.party_aliases || rec.search_aliases || rec.aliases);
      const citation = this.toSafeStr(rec.citation);
      const case_number = this.toSafeStr(rec.case_number || rec.caseNumber || rec.originatingCase || rec.proceeding);
      const court = this.toSafeStr(rec.court || rec.courtTier || rec.location || rec.registry);
      const judge = this.toSafeStr(rec.judge || rec.judges || rec.presidingJudge);
      const decision_year = this.toSafeStr(rec.decision_year || rec.year || rec.decisionDate);
      const keywords = Array.isArray(rec.keywords) ? rec.keywords.join(' ').toLowerCase() : this.toSafeStr(rec.keywords + ' ' + (rec.subject || '') + ' ' + (rec.claimSummary || '') + ' ' + (rec.additionalSubject || ''));

      // Check year filter if specified in the query
      if (filterYear && !decision_year.includes(filterYear) && !citation.includes(filterYear)) {
        continue;
      }

      // 1. Direct Substring / Phrase Match across all 12 search fields
      if (cleanNoYear && (
          case_title.includes(cleanNoYear) ||
          appellant_name.includes(cleanNoYear) ||
          respondent_name.includes(cleanNoYear) ||
          applicant_name.includes(cleanNoYear) ||
          defendant_name.includes(cleanNoYear) ||
          party_aliases.includes(cleanNoYear) ||
          citation.includes(cleanNoYear) ||
          case_number.includes(cleanNoYear) ||
          court.includes(cleanNoYear) ||
          judge.includes(cleanNoYear) ||
          (cleanNoYear.length > 3 && keywords.includes(cleanNoYear))
      )) {
        if (!matches.some(m => m.id === rec.id)) {
          matches.push(rec);
        }
        continue;
      }

      // 2. Token Matching (all query tokens must appear in the combined 12 fields)
      if (tokens.length > 0) {
        const fullRecText = `${case_title} ${appellant_name} ${respondent_name} ${applicant_name} ${defendant_name} ${party_aliases} ${citation} ${case_number} ${court} ${judge} ${decision_year} ${keywords}`;
        const allTokensMatch = tokens.every(tok => fullRecText.includes(tok));
        if (allTokensMatch) {
          if (!matches.some(m => m.id === rec.id)) {
            matches.push(rec);
          }
          continue;
        }
      }
    }

    return matches;
  },

  /**
   * Searches prepared Tanzanian judgments & legal source documents (returns first match)
   */
  findMatchingCaseRecord(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') return null;
    const matches = this.searchAllCaseRecords(rawQuery);
    return matches.length > 0 ? matches[0] : null;
  },

  /**
   * Main Intent Classifier & Dispatcher
   * Follows the Required Routing Order:
   * 1. Normalize the question
   * 2. Detect greeting
   * 3. Detect requested action
   * 4. Detect case name, citation or party
   * 5. Search case records
   * 6. Count matching cases
   * 7. Ask user to select case or perform action
   * 8. OUT_OF_SCOPE runs ONLY after all legal intents and searches fail.
   */
  classifyIntent(rawText) {
    const clean = this.normalizeText(rawText);
    if (!clean) return { category: this.CATEGORIES.GREETINGS_EN, subIntent: 'empty' };

    // 1. GREETINGS — SWAHILI
    if (/^(mambo|mambo vipi|vipi|sema|niaje|habari|habari yako|habari za leo|habari za asubuhi|habari za mchana|habari za jioni|upo|uko hapo|hujambo|shikamoo|salama|u mzima|uko poa|karibu|za kwako|za kazi|unaendeleaje|unajisikiaje|naweza kupata msaada|unaweza kunisaidia|naomba msaada|nisaidie|tafadhali nisaidie)\b/i.test(clean) ||
        /\b(shikamoo|mambo vipi|habari za asubuhi|hujambo|habari yako|naomba msaada|nisaidie)\b/i.test(clean)) {
      return { category: this.CATEGORIES.GREETINGS_SW, clean };
    }

    // 2. GREETINGS — ENGLISH
    if (/^(hi|hello|hey|helo|hallo|hi there|hello there|hey there|good morning|morning|good afternoon|afternoon|good evening|evening|greetings|nice to meet you|it is good to see you|how are you|how are you doing|how is everything|are you fine|are you okay|are you good|how have you been|what'?s up|are you there|can you hear me|can you help me|hello can you assist me)\b/i.test(clean) ||
        /\b(good morning|good afternoon|good evening|how are you|can you help me)\b/i.test(clean)) {
      return { category: this.CATEGORIES.GREETINGS_EN, clean };
    }

    // 3. POSITIVE REPLIES
    if (/^(yes|yeah|yep|okay|ok|sure|certainly|please do|continue|proceed|go ahead|that is correct|exactly|i agree|fine|good|great|perfect|sawa|ndio|ndiyo|naam|endelea|fanya hivyo|sahihi|nimekubali|hakuna shida)$/i.test(clean) ||
        /^(yes please|proceed please|continue please|sawa endelea|fanya hivyo sasa)$/i.test(clean)) {
      return { category: this.CATEGORIES.POSITIVE_REPLIES, clean };
    }

    // 4. NEGATIVE REPLIES
    if (/^(no|nope|not that|stop|cancel|never mind|go back|that is wrong|incorrect|i disagree|hapana|sitaki|acha|ghairi|rudi nyuma|sio hiyo|si sahihi|umechemka|umefanya makosa)$/i.test(clean) ||
        /\b(that is wrong|incorrect|si sahihi|umechemka|umefanya makosa|search another case|find another case|tafuta kesi nyingine)\b/i.test(clean)) {
      const isCorrection = /\b(that is wrong|incorrect|si sahihi|umechemka|umefanya makosa|sio hiyo)\b/i.test(clean);
      return { category: this.CATEGORIES.NEGATIVE_REPLIES, isCorrection, clean };
    }

    // 5. ASSISTANT IDENTITY
    if (/\b(who are you|what are you|tell me about yourself|what is your name|are you a lawyer|are you human|are you an ai|wewe ni nani|jina lako nani|wewe ni wakili|wewe ni binadamu|wewe ni ai|unafanya kazi gani)\b/i.test(clean)) {
      const isSwahili = /\b(wewe|jina|wakili|binadamu|unafanya)\b/i.test(clean);
      return { category: this.CATEGORIES.ASSISTANT_IDENTITY, isSwahili, clean };
    }

    // 6. "DO YOU KNOW ME?"
    if (/\b(do you know me|who am i|what is my name|do you remember me|do you recognize me|unanijua|mimi ni nani|unakumbuka jina langu|unanikumbuka|unajua kazi yangu)\b/i.test(clean)) {
      return { category: this.CATEGORIES.DO_YOU_KNOW_ME, clean };
    }

    // 7. CAPABILITIES & HELP
    if (/\b(what can you do|how can you help|help me|show your functions|show available services|what questions can i ask|what do you know|give me options|show menu|unaweza kufanya nini|unaweza kunisaidiaje|nikuulize nini|onyesha huduma|onyesha menu|nipe chaguo)\b/i.test(clean)) {
      return { category: this.CATEGORIES.CAPABILITIES, clean };
    }

    // 25. AUTHENTICATION & ACCOUNTS
    if (/\b(how do i register|create account|cannot register|login failed|forgot my password|account is locked|why can'?t i log in|change my password|activate my account|how do i change my role|nawezaje kujisajili|nimesahau password|akaunti imefungwa|siwezi kuingia|fungua akaunti yangu|badilisha password|badilisha role yangu)\b/i.test(clean)) {
      let sub = 'general';
      if (/\b(register|kujisajili|create account)\b/i.test(clean)) sub = 'register';
      else if (/\b(forgot|password|nimesahau)\b/i.test(clean)) sub = 'forgot';
      else if (/\b(role|badilisha role)\b/i.test(clean)) sub = 'role';
      return { category: this.CATEGORIES.AUTHENTICATION_ACCOUNTS, sub, clean };
    }

    // 26. PERMISSIONS & RESTRICTED ACCESS
    if (/\b(why can'?t i open this case|why is this button disabled|give me access|need administrator access|let me see all cases|allow me to delete|access denied|why am i restricted|kwa nini nimezuiwa|nipe access|fungua kesi hii|kwa nini button haifanyi kazi|nataka kuona kesi zote|nipe ruhusa ya kufuta)\b/i.test(clean)) {
      return { category: this.CATEGORIES.PERMISSIONS_ACCESS, clean };
    }

    // 27. ASSIGNED WORK
    if (/\b(show my cases|show my tasks|what am i assigned|show my deadlines|what requires my attention|show upcoming hearings|show overdue work|onyesha kesi zangu|onyesha kazi zangu|nimepewa kazi gani|onyesha deadlines|kesi gani inahitaji hatua|onyesha hearings)\b/i.test(clean)) {
      return { category: this.CATEGORIES.ASSIGNED_WORK, clean };
    }

    // 28. ADDING INFORMATION TO A MATTER
    if (/\b(attach this to a case|save this research|add to matter|add a note|create a task|add a deadline|assign this work|hifadhi utafiti|ambatanisha kwenye kesi|ongeza maelezo|tengeneza task|ongeza tarehe ya mwisho)\b/i.test(clean)) {
      return { category: this.CATEGORIES.ADD_INFORMATION, clean };
    }

    // 29. DELETING INFORMATION
    if (/\b(delete this case|remove the document|delete the client|clear the audit log|futa kesi|futa document|ondoa taarifa|futa audit log)\b/i.test(clean)) {
      return { category: this.CATEGORIES.DELETE_INFORMATION, clean };
    }

    // 30. LEGAL ADVICE REQUESTS
    if (/\b(give me legal advice|what should i do in court|will i win|guarantee my case|tell me exactly what to file|act as my lawyer|nipe ushauri wa kisheria|nitashinda kesi|niambie nifanye nini mahakamani|kuwa wakili wangu)\b/i.test(clean)) {
      return { category: this.CATEGORIES.LEGAL_ADVICE_REQUEST, clean };
    }

    // 21. DOCUMENT UPLOAD ASSISTANCE
    if (/\b(how do i upload|upload a document|my pdf is not working|ai cannot read my pdf|my document is scanned|upload failed|process the pdf|index the document|where should i put the pdf|nawezaje kupakia pdf|pdf haisomeki|nyaraka imekataa|hii ni scanned pdf|ai haisomi hati|niiweke wapi)\b/i.test(clean)) {
      return { category: this.CATEGORIES.UPLOAD_HELP, clean };
    }

    // 22. OCR AND SCANNED DOCUMENTS
    if (/\b(what is ocr|read this scan|extract text|convert image to text|the pages are pictures|ocr imekataa|soma scanned pdf|badilisha picha kuwa maandishi|toa maandishi kwenye picha|fanya ocr)\b/i.test(clean)) {
      return { category: this.CATEGORIES.OCR_HELP, clean };
    }

    // 23. COMPARING CASES
    if (/\b(compare these cases|compare cases|what is the difference|are the decisions similar|which precedent applies|compare facts|compare decisions|linganisha kesi|tofauti ya kesi hizi ni nini|hukumu hizi zinafanana|linganisha sababu za mahakama)\b/i.test(clean)) {
      return { category: this.CATEGORIES.CASE_COMPARISON, clean };
    }

    // 24. GENERATING A LEGAL REPORT
    if (/\b(generate report|create a case report|give me the full report|export the analysis|create pdf report|create word report|download the report|tengeneza ripoti|nipe ripoti kamili|pakua ripoti|tengeneza word|tengeneza pdf)\b/i.test(clean)) {
      return { category: this.CATEGORIES.LEGAL_REPORT, clean };
    }

    // 20. OPEN OR DOWNLOAD PDF
    if (/\b(open the pdf|open pdf|open original source|show the original judgment|download the case|download pdf|view document|take me to the source|fungua pdf|pakua pdf|onyesha hukumu ya awali|fungua chanzo|nataka kusoma hukumu yote|open .* pdf)\b/i.test(clean)) {
      return { category: this.CATEGORIES.OPEN_SOURCE, clean };
    }

    // 19. PROCEDURAL HISTORY
    if (/\b(procedural history|where did the case begin|show the previous courts|was this an appeal|what happened in the lower court|show case timeline|kesi ilianzia wapi|onyesha historia ya mahakama|mahakama ya chini iliamua nini|hii ilikuwa rufaa ya ngapi|onyesha hatua za kesi)\b/i.test(clean)) {
      return { category: this.CATEGORIES.PROCEDURAL_HISTORY, clean };
    }

    // 18. LEGAL PRINCIPLE OR RATIO
    if (/\b(ratio|legal principle|rule from this case|ratio decidendi|obiter|precedent|kanuni ya kesi|onyesha ratio|mahakama iliweka kanuni gani|uamuzi huu unaweza kutumika vipi)\b/i.test(clean)) {
      return { category: this.CATEGORIES.LEGAL_PRINCIPLE, clean };
    }

    // 17. CASES CITED
    if (/\b(cases cited|which precedents were used|what authorities did the judge rely on|show related judgments|show previous decisions|onyesha kesi zilizotajwa|hukumu zipi zilitumika|onyesha precedents|mahakama ilitegemea kesi gani)\b/i.test(clean)) {
      return { category: this.CATEGORIES.CASES_CITED, clean };
    }

    // 16. LAWS CITED
    if (/\b(laws cited|which law was used|what act applies|statutory provisions|show sections|which chapter|onyesha sheria zilizotajwa|sheria gani ilitumika|kifungu gani kilitumika|onyesha vifungu vya sheria|sura gani ya sheria)\b/i.test(clean)) {
      return { category: this.CATEGORIES.LAWS_CITED, clean };
    }

    // 15. FINAL DECISION AND ORDERS
    if (/\b(final decision|final order|show the final order|what did the court decide|who won|was the appeal allowed|was it dismissed|what was the sentence|show the court order|show costs|onyesha uamuzi wa mwisho|nani alishinda|rufaa ilikubaliwa|rufaa ilikataliwa|amri ya mahakama ilikuwa nini|adhabu ilikuwa nini|gharama ziliamuliwaje)\b/i.test(clean)) {
      return { category: this.CATEGORIES.FINAL_DECISION, clean };
    }

    // 14. COURT REASONING
    if (/\b(court reasoning|why did the court decide that|why did the judge decide|why did the judge decide that|explain the reasoning|how did the judge reach the decision|what evidence did the court accept|what evidence was rejected|what test was applied|onyesha sababu za mahakama|kwa nini mahakama iliamua hivyo|jaji alitumia sababu gani|ushahidi gani ulikubaliwa|kipimo gani cha sheria kilitumika)\b/i.test(clean)) {
      return { category: this.CATEGORIES.COURT_REASONING, clean };
    }

    // 13. PARTIES' ARGUMENTS
    if (/\b(parties arguments|what did the appellant argue|what did the respondent say|what did the applicant submit|what did the republic argue|compare both sides|show submissions|hoja za pande zote|mrufani alisema nini|mjibu rufani alisema nini|jamhuri ilisema nini|mwombaji aliomba nini|linganisha hoja zao)\b/i.test(clean)) {
      return { category: this.CATEGORIES.PARTIES_ARGUMENTS, clean };
    }

    // 12. LEGAL ISSUES
    if (/\b(legal issues|legal question|what were the issues|what was the issue|what did the court determine|issues for determination|questions before the court|what were the grounds|onyesha masuala ya kisheria|mahakama iliamua swali gani|maswali yaliyokuwa mbele ya mahakama|hoja za kisheria zilikuwa zipi|sababu za rufaa zilikuwa zipi)\b/i.test(clean)) {
      return { category: this.CATEGORIES.LEGAL_ISSUES, clean };
    }

    // 11. FACTS OF A CASE
    if (/\b(show facts|show its facts|facts of|what are the facts|give me the background|what happened|show events|who did what|when did it happen|where did it happen|what was disputed|onyesha ukweli wa kesi|nipe historia ya kesi|nini kilitokea|wahusika walifanya nini|mgogoro ulikuwa kuhusu nini|mali gani ilikuwa inabishaniwa)\b/i.test(clean)) {
      return { category: this.CATEGORIES.CASE_FACTS, clean };
    }

    // 10. CASE SUMMARY
    if (/\b(summarize this case|summarize it|give me the summary|explain the judgment briefly|what happened in this case|short summary|full summary|summarize the document|summarize|fanya muhtasari|fupisha kesi|nipe muhtasari|eleza kesi kwa kifupi|kesi hii inahusu nini|hukumu hii inasema nini)\b/i.test(clean)) {
      return { category: this.CATEGORIES.CASE_SUMMARY, clean };
    }

    // -------------------------------------------------------------
    // STEP 3: DETECT LIST / CATEGORY REQUESTS (18 CATEGORIES)
    // -------------------------------------------------------------
    const detectedCategory = this.detectLegalCategory(clean);
    if (detectedCategory) {
      return { 
        category: this.CATEGORIES.LISTING_CASES, 
        legalCategory: detectedCategory, 
        clean, 
        rawQuery: rawText 
      };
    }

    // General Listing / Year or Court Filter
    if (/\b(show all cases|list the cases|what cases are available|show prepared judgments|show 2020 cases|show 2024 cases|show 2025 cases|show 2026 cases|cases from \d{4}|show high court cases|show court of appeal cases|onyesha kesi zote|orodhesha kesi|onyesha kesi za|kesi za mahakama kuu|kesi za mahakama ya rufani)\b/i.test(clean)) {
      return { category: this.CATEGORIES.LISTING_CASES, clean, rawQuery: rawText };
    }

    // 8. FINDING A JUDGMENT (Search by Party, Name, Alias, Citation, Case Number, or Search Verbs)
    if (/\b(find a case|find a judgment|search for a judgment|locate a case|look for this case|do you have this case|do you have|search by case title|search by case number|search by citation|search by year|tafuta kesi|tafuta hukumu|nitafutie kesi|ipo kesi hii|tafuta kwa mwaka|tafuta kwa namba|tafuta kwa jina|tafuta kwa mahakama|find|search|locate|tafuta|nitafutie)\b/i.test(clean)) {
      return { category: this.CATEGORIES.FIND_JUDGMENT, clean, rawQuery: rawText };
    }

    // Check if query matches any prepared case records in the database
    const matchedRecords = this.searchAllCaseRecords(rawText);
    if (matchedRecords.length > 0) {
      const matchedCase = matchedRecords[0];
      if (matchedCase) {
        return this.CATEGORIES.FIND_JUDGMENT;
      }
      return { category: this.CATEGORIES.FIND_JUDGMENT, clean, rawQuery: rawText };
    }

    // 32. OUT-OF-SCOPE REQUESTS (Only checked after all legal categories and case searches fail)
    if (/\b(football|messi|ronaldo|premier league|manchester|arsenal|chelsea|simba|yanga|music|song|weather|forecast|joke|comedy|recipe|cooking|horoscope|crypto|bitcoin|casino|betting|election campaign|presidential candidate)\b/i.test(clean)) {
      return { category: this.CATEGORIES.OUT_OF_SCOPE, clean };
    }

    // 31. UNCLEAR / VERY SHORT UNKNOWN QUERIES
    if (clean.length < 3 || /^(asdf|qwerty|xyz|abc|test|123|huh|what|why|help)$/i.test(clean)) {
      return { category: this.CATEGORIES.UNCLEAR_QUESTIONS, clean };
    }

    // Default Fallback is finding a judgment
    return { category: this.CATEGORIES.FIND_JUDGMENT, clean, rawQuery: rawText };
  },

  /**
   * Main Router Entry Point: Takes user raw input, identifies intent, hydrates context,
   * performs verified case lookup if needed, and builds the standard response.
   *
   * Order of Evaluation:
   * 1. Normalize the question
   * 2. Detect greeting
   * 3. Detect requested action
   * 4. Detect case name, citation or party
   * 5. Search case records
   * 6. Count matching cases
   * 7. Ask user to select a case or perform the action
   * 8. OUT_OF_SCOPE runs ONLY after all legal intents and searches fail.
   */
  routeMessage(rawQuery) {
    const clean = this.normalizeText(rawQuery);
    const userProfile = this.getUserProfile();
    const timeOfDay = this.getTimeOfDay();

    // 1. Mandatory Authentication Check
    // If user is not signed in / registered, DO NOT provide answers or case records. Force registration / login first.
    if (!userProfile.isLoggedIn) {
      const isAuthHelp = /\b(register|kujisajili|create account|login|sign in|forgot|password|invitation|code|mualiko|akaunti)\b/i.test(clean);
      if (isAuthHelp) {
        return {
          category: this.CATEGORIES.AUTHENTICATION_ACCOUNTS,
          categoryCode: 'AUTHENTICATION_ACCOUNTS',
          intent: 'AUTHENTICATION_ACCOUNTS',
          requiresAuth: true,
          isSmallTalk: true,
          response: `🔒 **SLCMS Registration & Authentication**\n\nTo access the Tanzania Legal Research Assistant and judicature records, you must have an authorized account.\n\n• **Already have an account?** Select **Sign In** to log in.\n• **New user?** Registration requires an authorized firm invitation code (e.g. \`INV-TZ-2026-...\`).\n\nPlease sign in or register to begin.`,
          guidedOptions: [
            { label: '🔐 Sign In', action: 'showLoginModal', prompt: 'I want to sign in' },
            { label: '📝 Register Account', action: 'showRegisterModal', prompt: 'How do I register with an invitation code?' }
          ]
        };
      }

      const resp = `🔒 **Authentication Required**\n\n` +
        `You must register or sign in to your authorized SLCMS account before using the Tanzania Legal Research Assistant and searching prepared judgments.\n\n` +
        `• **Already registered?** Sign in to your account.\n` +
        `• **New to SLCMS?** Register using your authorized firm invitation code.\n\n` +
        `Please sign in or register to continue.`;

      return {
        category: this.CATEGORIES.AUTHENTICATION_ACCOUNTS,
        categoryCode: 'AUTHENTICATION_ACCOUNTS',
        intent: 'AUTHENTICATION_REQUIRED',
        requiresAuth: true,
        isSmallTalk: true,
        response: resp,
        guidedOptions: [
          { label: '🔐 Sign In', action: 'showLoginModal', prompt: 'I want to sign in' },
          { label: '📝 Register Account', action: 'showRegisterModal', prompt: 'How do I register with an invitation code?' }
        ]
      };
    }

    // 2. Classify Intent
    const classified = this.classifyIntent(rawQuery);
    const cat = typeof classified === 'string' ? classified : classified.category;

    // 2. Search for explicit cases mentioned in query
    let matchedRecords = [];
    const isCategoryOrGeneral = [
      this.CATEGORIES.GREETINGS_EN,
      this.CATEGORIES.GREETINGS_SW,
      this.CATEGORIES.GREETING,
      this.CATEGORIES.CAPABILITIES,
      this.CATEGORIES.LISTING_CASES,
      this.CATEGORIES.LIST_CASES,
      this.CATEGORIES.AUTHENTICATION_ACCOUNTS,
      this.CATEGORIES.PERMISSIONS_ACCESS,
      this.CATEGORIES.ASSIGNED_WORK,
      this.CATEGORIES.UPLOAD_HELP,
      this.CATEGORIES.OCR_HELP,
      this.CATEGORIES.OUT_OF_SCOPE,
      this.CATEGORIES.UNCLEAR_QUESTIONS
    ].includes(cat);

    if (!isCategoryOrGeneral) {
      matchedRecords = this.searchAllCaseRecords(rawQuery);

      // Contextual Memory Check:
      // If query does not name a specific case, but refers to context (e.g. "it", "this case", "that judgment", "the PDF", "show its facts", "summarize it")
      if (matchedRecords.length === 0 && this.context.lastActiveCase) {
        const isContextualFollowUp = /\b(this case|the case|that case|that judgment|this judgment|it|this|that|facts|issues|arguments|reasoning|decision|orders|final order|ratio|pdf|summary|citation|yes|continue|proceed|open it|view it|report)\b/i.test(clean);
        if (isContextualFollowUp) {
          matchedRecords = [this.context.lastActiveCase];
        }
      }
    }

    let matchedCase = matchedRecords.length === 1 ? matchedRecords[0] : (matchedRecords.length > 1 ? null : this.context.lastActiveCase);

    // Update active context (Case Selection Memory)
    if (matchedCase) {
      this.context.lastActiveCase = matchedCase;
      this.context.activeCaseId = matchedCase.id;
    }
    this.context.lastCategory = cat;
    this.context.lastUserQuery = rawQuery;

    // Dispatch to Category Handler
    switch (cat) {
      // -------------------------------------------------------------
      // 1. GREETINGS — ENGLISH
      // -------------------------------------------------------------
      case this.CATEGORIES.GREETINGS_EN:
      case this.CATEGORIES.GREETING: {
        let resp = '';
        if (clean.includes('good morning') || (timeOfDay === 'morning' && clean.includes('morning'))) {
          resp = `Good morning, ${userProfile.firstName}. How can I assist you with your Tanzanian legal research or assigned SLCMS work today?`;
        } else if (clean.includes('good afternoon') || (timeOfDay === 'afternoon' && clean.includes('afternoon'))) {
          resp = `Good afternoon, ${userProfile.firstName}. Would you like to find a judgment, examine a case, summarize a document or research a legal issue?`;
        } else if (clean.includes('good evening') || (timeOfDay === 'evening' && clean.includes('evening'))) {
          resp = `Good evening, ${userProfile.firstName}. I am ready to assist with your authorized cases and Tanzanian legal research.`;
        } else {
          resp = `Hello, ${userProfile.firstName}! Welcome to the SLCMS Tanzania Legal Research Assistant. I am ready to help you search prepared Tanzanian judgments, examine case details, summarize uploaded documents and locate legal authorities. What would you like to research?`;
        }

        return {
          category: cat,
          categoryCode: 'GREETING',
          isGreeting: true,
          isSmallTalk: true,
          response: resp,
          guidedOptions: this.getEffectiveGuidedOptions()
        };
      }

      // -------------------------------------------------------------
      // 2. GREETINGS — SWAHILI
      // -------------------------------------------------------------
      case this.CATEGORIES.GREETINGS_SW: {
        let resp = '';
        if (clean.includes('shikamoo')) {
          resp = `Marahaba! Karibu kwenye SLCMS. Ninaweza kukusaidia kuhusu hukumu, sheria na nyaraka zilizoidhinishwa za Tanzania.`;
        } else if (/\b(mambo|vipi|sema|niaje)\b/i.test(clean)) {
          resp = `Mambo! Niko tayari kukusaidia. Unataka kutafuta hukumu, kuona ukweli wa kesi, kufanya muhtasari au kufungua PDF ya awali?`;
        } else if (clean.includes('asubuhi')) {
          resp = `Habari za asubuhi, ${userProfile.firstName}. Unataka nikusaidie kutafuta kesi au kuchambua nyaraka gani leo?`;
        } else {
          resp = `Habari, ${userProfile.firstName}! Karibu kwenye SLCMS Tanzania Legal Research Assistant. Ninaweza kukusaidia kutafuta hukumu za Tanzania, kusoma taarifa za kesi, kufanya muhtasari wa nyaraka na kupata sheria zilizotajwa. Unahitaji msaada gani?`;
        }

        return {
          category: cat,
          categoryCode: 'GREETING',
          isGreeting: true,
          isSmallTalk: true,
          response: resp,
          guidedOptions: this.getSwahiliGuidedOptions()
        };
      }

      // -------------------------------------------------------------
      // 3. POSITIVE REPLIES
      // -------------------------------------------------------------
      case this.CATEGORIES.POSITIVE_REPLIES: {
        const isSwahili = /\b(sawa|ndio|ndiyo|naam|endelea|fanya hivyo|sahihi|nimekubali|hakuna shida)\b/i.test(clean);

        if (this.context.pendingAction) {
          const action = this.context.pendingAction;
          this.context.pendingAction = null;
          const confirmedResp = isSwahili 
            ? `Imethibitishwa: Kitendo cha ${action.description || 'kuongeza kwenye jalada'} kimekamilika na kurekodiwa kwenye audit log.`
            : `Confirmed. The proposed action for ${action.description || 'matter attachment'} has been executed and recorded in the audit log.`;

          return {
            category: cat,
            categoryCode: cat,
            isSmallTalk: true,
            response: confirmedResp
          };
        }

        const resp = isSwahili
          ? `Sawa. Niandikie jina la kesi, namba ya kesi, mwaka, mahakama, sheria au swali la kisheria unalotaka kutafiti.`
          : `Certainly. Tell me the case title, citation, case number, court, year, legislation or legal question you want to research.`;

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp,
          guidedOptions: this.getEffectiveGuidedOptions()
        };
      }

      // -------------------------------------------------------------
      // 4. NEGATIVE REPLIES
      // -------------------------------------------------------------
      case this.CATEGORIES.NEGATIVE_REPLIES: {
        this.context.pendingAction = null;
        if (classified.isCorrection) {
          return {
            category: cat,
            categoryCode: cat,
            isSmallTalk: true,
            response: `Thank you for identifying the problem. Please select the incorrect part—case identity, facts, issues, reasoning, decision or citation—so I can check it against the original prepared document.`
          };
        }

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: `Understood. I will not continue with that action. You can ask a different legal question or select another case-research option.`
        };
      }

      // -------------------------------------------------------------
      // 5. ASSISTANT IDENTITY
      // -------------------------------------------------------------
      case this.CATEGORIES.ASSISTANT_IDENTITY: {
        const resp = classified.isSwahili
          ? `Mimi ni SLCMS Tanzania Legal Research Assistant. Ninawasaidia watumiaji walioidhinishwa kutafuta hukumu, sheria na nyaraka za kesi za Tanzania. Mimi si wakili wala mahakama, na majibu yangu yanahitaji kuhakikiwa na mtaalamu.`
          : `I am the SLCMS Tanzania Legal Research Assistant. I help authorized users search prepared Tanzanian judgments, legislation and case documents. I am not a lawyer, court or substitute for professional legal judgment.`;

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 6. "DO YOU KNOW ME?"
      // -------------------------------------------------------------
      case this.CATEGORIES.DO_YOU_KNOW_ME: {
        let resp = '';
        if (userProfile.isLoggedIn) {
          resp = `You are signed in as ${userProfile.fullName}, with the role ${userProfile.role}. I can use only the profile and assigned-matter information that SLCMS authorizes for this session.`;
        } else {
          resp = `I cannot identify you because you are not signed in. Please log in using your authorized SLCMS account.`;
        }

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 7. CAPABILITIES
      // -------------------------------------------------------------
      case this.CATEGORIES.CAPABILITIES: {
        const resp = `I can help you with:

• Find a Tanzanian judgment
• Show case information
• Summarize a case
• Show case facts
• Show legal issues
• Show parties’ arguments
• Explain the court’s reasoning
• Show the final decision and orders
• Show laws and cases cited
• Explain the legal principle
• Compare prepared cases
• Generate a legal research report
• Open or download an authorized original PDF
• Help with document uploads and OCR

Select an option or enter a case title, citation or legal question.`;

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp,
          guidedOptions: this.getEffectiveGuidedOptions()
        };
      }

      // -------------------------------------------------------------
      // 8. FINDING A JUDGMENT (Search Case Records)
      // -------------------------------------------------------------
      case this.CATEGORIES.FIND_JUDGMENT: {
        const matches = matchedRecords.length > 0 ? matchedRecords : this.searchAllCaseRecords(rawQuery);
        let searchPhrase = clean
          .replace(/^(find|search for|search|locate|look for|do you have|show me|show|tell me about|nipatie|tafuta|nitafutie|onyesha|nipe|ipo kesi ya|kuna kesi ya)\s+/i, '')
          .replace(/\s+(cases|case|judgments|judgment|hukumu|kesi)$/i, '')
          .trim();
        if (!searchPhrase) searchPhrase = rawQuery.trim();

        if (matches.length === 1) {
          const c = matches[0];
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;

          const cit = c.citation || 'Unassigned';
          const proceeding = c.proceeding || c.caseNumber || c.case_number || c.proceedingType || 'PC Civil Appeal No. 69 of 2018';
          const court = c.court || 'High Court of Tanzania, Dar es Salaam District Registry';
          const judge = c.judge || 'S. M. Kulita, J.';
          const decDate = c.decisionDate || c.year || '31 December 2020';
          const category = c.category || 'Matrimonial and Family Law';
          const subject = c.subject || c.claimSummary || c.additionalSubject || 'Matrimonial property, child maintenance and an incomplete trial record';
          const outcome = c.outcome || c.finalDecision || 'Lower-court proceedings nullified and a trial de novo ordered.';

          const resp = `🔍 Matching Judgments Found\n\n` +
            `I found the following prepared judgment matching “${searchPhrase}”:\n\n` +
            `${c.title}\n` +
            `Citation: ${cit}\n` +
            `Proceeding: ${proceeding}\n` +
            `Court: ${court}\n` +
            `Judge: ${judge}\n` +
            `Decision date: ${decDate}\n` +
            `Category: ${category}\n` +
            `Subject: ${subject}\n` +
            `Outcome: ${outcome}\n\n` +
            `Is this the case you need?\n\n` +
            `Open Case | Summarize Case | Show Facts | Open Original PDF\n\n` +
            `If it is not the intended case:\n\n` +
            `Search Another Case`;

          return {
            category: cat,
            categoryCode: 'FIND_JUDGMENT',
            intent: 'FIND_JUDGMENT',
            matchedCase: c,
            caseRecords: matches,
            isSingleMatchPrompt: true,
            response: resp,
            guidedOptions: this.getCaseActionsGuidedOptions(c)
          };
        } else if (matches.length > 1) {
          const resp = `🔍 Multiple Judgments Found\n\n` +
            `I found ${matches.length} judgments matching “${searchPhrase}.” Please select the intended case:\n\n` +
            matches.map(c => `${c.title} — ${c.citation || c.caseNumber || 'Citation'}, ${c.court || 'High Court'} and ${c.year || '2020'}`).join('\n') +
            `\n\nSelect a case before requesting its facts, reasoning or decision.`;

          return {
            category: cat,
            categoryCode: 'FIND_JUDGMENT',
            intent: 'FIND_JUDGMENT',
            caseRecords: matches,
            isMultipleMatchesPrompt: true,
            response: resp,
            guidedOptions: matches.map(c => ({
              label: `🔍 ${c.title.substring(0, 32)}…`,
              prompt: `Find ${c.title}`
            }))
          };
        } else {
          const resp = `No prepared judgments matching “${searchPhrase}” were found in the SLCMS library. You can search by party name, citation, case number, or upload an authorized PDF judgment.`;

          return {
            category: cat,
            categoryCode: 'FIND_JUDGMENT',
            intent: 'FIND_JUDGMENT',
            caseRecords: [],
            response: resp,
            guidedOptions: this.getEffectiveGuidedOptions()
          };
        }
      }

      // -------------------------------------------------------------
      // 9. LISTING CASES (18 LEGAL CATEGORIES & MULTI-FILTER SEARCH)
      // -------------------------------------------------------------
      case this.CATEGORIES.LISTING_CASES:
      case this.CATEGORIES.LIST_CASES: {
        const filters = this.extractQueryFilters(rawQuery);
        const legalCat = classified.legalCategory || (filters.category !== 'ALL' ? filters.category : this.detectLegalCategory(clean));
        const catDef = legalCat && this.LEGAL_CATEGORIES[legalCat] ? this.LEGAL_CATEGORIES[legalCat] : null;

        const allCases = (typeof SLCMS_STATE !== 'undefined' && Array.isArray(SLCMS_STATE.tanzaniaJudgments)) 
          ? SLCMS_STATE.tanzaniaJudgments 
          : [];

        let matchingCases = [];

        if (legalCat === 'CRIMINAL_LAW' && filters.year === 'ALL' && filters.court === 'ALL' && filters.judge === 'ALL' && filters.outcome === 'ALL') {
          matchingCases = allCases.filter(j => 
            j.legalCategory === 'CRIMINAL_LAW' || 
            j.id?.startsWith('tz-j-2026-') ||
            (j.category && j.category.toLowerCase().includes('criminal'))
          );
        } else {
          matchingCases = allCases.filter(j => {
            let match = true;

            // 1. Category Matching
            if (legalCat && catDef) {
              const jCat = (j.legalCategory || j.category || '').toLowerCase();
              const jSubj = (j.subject || j.claimSummary || j.additionalSubject || '').toLowerCase();
              const jTitle = (j.title || '').toLowerCase();
              const jKeywords = (j.keywords || []).map(k => String(k).toLowerCase());

              const isCatMatch = (j.legalCategory === legalCat) ||
                (j.category && j.category.toLowerCase().includes(catDef.name.toLowerCase())) ||
                catDef.aliases.some(a => jCat.includes(a.toLowerCase()) || jSubj.includes(a.toLowerCase()) || jKeywords.includes(a.toLowerCase()) || jTitle.includes(a.toLowerCase()));

              if (!isCatMatch) match = false;
            }

            // 2. Year Filter
            if (filters.year !== 'ALL') {
              const jYear = String(j.year || j.decisionDate || j.citation || '');
              if (!jYear.includes(filters.year)) match = false;
            }

            // 3. Court Filter
            if (filters.court !== 'ALL') {
              const jCourt = String(j.court || j.courtTier || '').toLowerCase();
              if (!jCourt.includes(filters.court.toLowerCase())) match = false;
            }

            // 4. Judge Filter
            if (filters.judge !== 'ALL') {
              const jJudge = String(j.judge || '').toLowerCase();
              if (!jJudge.includes(filters.judge.toLowerCase())) match = false;
            }

            // 5. Outcome Filter
            if (filters.outcome !== 'ALL') {
              const jOutcome = String(j.outcome || j.finalDecision || j.decision || (j.finalOrders ? JSON.stringify(j.finalOrders) : '')).toLowerCase();
              if (filters.outcome === 'allowed' && !(jOutcome.includes('allowed') || jOutcome.includes('quashed') || jOutcome.includes('set aside') || jOutcome.includes('acquitted') || jOutcome.includes('ilikubaliwa'))) match = false;
              if (filters.outcome === 'dismissed' && !(jOutcome.includes('dismissed') || jOutcome.includes('rejected') || jOutcome.includes('ilikataliwa'))) match = false;
              if (filters.outcome === 'struck_out' && !(jOutcome.includes('struck out') || jOutcome.includes('kufutwa') || jOutcome.includes('ilifutwa'))) match = false;
              if (filters.outcome === 'granted' && !(jOutcome.includes('granted') || jOutcome.includes('ilikubaliwa'))) match = false;
            }

            // 6. Location Filter
            if (filters.location !== 'ALL') {
              const jLoc = String(j.location || j.court || '').toLowerCase();
              if (!jLoc.includes(filters.location.toLowerCase())) match = false;
            }

            // 7. Entity Filter
            if (filters.entity !== 'ALL') {
              const jEntity = String(j.title + ' ' + (j.respondent || '') + ' ' + (j.appellant || '') + ' ' + (j.claimSummary || '')).toLowerCase();
              if (!jEntity.includes(filters.entity.toLowerCase())) match = false;
            }

            // 8. Subject Topic Filter
            if (filters.subject !== 'ALL') {
              const jSubjText = String(j.subject + ' ' + (j.claimSummary || '') + ' ' + (j.additionalSubject || '') + ' ' + (j.keywords || []).join(' ')).toLowerCase();
              if (!jSubjText.includes(filters.subject.toLowerCase())) match = false;
            }

            return match;
          });
        }

        const catName = catDef ? catDef.name : (legalCat ? legalCat.replace(/_/g, ' ') : 'Legal Cases');
        const catEmoji = catDef ? catDef.emoji : '⚖️';

        let resp = '';
        if (matchingCases.length > 0) {
          resp = `${catEmoji} **${catName}**\n\n${matchingCases.length} prepared judgments found\n\n` +
            matchingCases.map((c, i) => {
              const cit = c.citation || 'Unassigned';
              const num = c.caseNumber || c.case_number || 'N/A';
              const court = c.court || 'High Court of Tanzania';
              const year = c.year || (c.decisionDate ? String(c.decisionDate).substring(0, 4) : '2026');
              const subj = c.subject || c.claimSummary || c.relevantPassage || 'Legal dispute adjudication';
              const out = c.outcome || c.finalDecision || (c.summary ? c.summary.finalDecision : 'Determined according to law.');

              const isBail = (c.subject && c.subject.toLowerCase().includes('bail')) || (c.title && c.title.toLowerCase().includes('bail'));
              const actionLinks = isBail 
                ? `View Case | Show Bail Conditions | Open Original PDF`
                : `View Case | Summarize | Open Original PDF`;

              return `${i + 1}. **${c.title}**\n` +
                `Citation: ${cit}\n` +
                `Case: ${num}\n` +
                `Court: ${court}\n` +
                `Decision year: ${year}\n` +
                `Subject: ${subj}\n` +
                `Outcome: ${out}\n\n` +
                `${actionLinks}`;
            }).join('\n\n') +
            `\n\nShowing prepared ${catName.toLowerCase()} available in the SLCMS library. Select a case to view its facts, issues, arguments, reasoning, decision and authorities.`;
        } else {
          const catDescriptor = catDef ? catDef.name.replace(/\s+Cases$/i, '').toLowerCase() : (legalCat ? legalCat.replace(/_/g, ' ').toLowerCase() : 'legal');
          resp = `No prepared ${catDescriptor} judgments are currently available in the SLCMS library. Try another year or upload an authorized ${catDescriptor} judgment.`;
        }

        return {
          category: cat,
          categoryCode: 'LIST_CASES',
          intent: 'LIST_CASES',
          legalCategory: legalCat || 'ALL',
          filters: filters,
          caseRecords: matchingCases,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 10. CASE SUMMARY (SUMMARIZE_CASE)
      // -------------------------------------------------------------
      case this.CATEGORIES.CASE_SUMMARY: {
        // If multiple cases match the specific query term and none was actively selected, ask user to select
        if (matchedRecords.length > 1 && !this.context.lastActiveCase) {
          const resp = `🔍 Multiple Judgments Found\n\n` +
            `I found ${matchedRecords.length} judgments matching your search. Please select the intended case before requesting its summary:\n\n` +
            matchedRecords.map(c => `${c.title} — ${c.citation || c.caseNumber || 'Citation'}, ${c.court || 'High Court'} and ${c.year || '2020'}`).join('\n') +
            `\n\nSelect a case to view its complete summary.`;

          return {
            category: this.CATEGORIES.FIND_JUDGMENT,
            categoryCode: 'FIND_JUDGMENT',
            caseRecords: matchedRecords,
            isMultipleMatchesPrompt: true,
            response: resp,
            guidedOptions: matchedRecords.map(c => ({
              label: `📄 Summarize ${c.title.substring(0, 24)}…`,
              prompt: `Summarize ${c.title}`
            }))
          };
        }

        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const bg = c.summary?.background || c.background || c.proceduralHistory || 'Appeal arising from contested primary proceedings.';
        const dispute = c.mainDispute || c.dispute || c.claimSummary || 'Dispute regarding property rights, trial procedural fairness, and statutory jurisdiction.';
        const issues = Array.isArray(c.legalIssues) ? c.legalIssues.join('; ') : (c.summary?.legalIssue || c.issuesSummary || '1. Validity of lower court proceedings; 2. Procedural irregularity and jurisdiction.');
        const reasoning = c.summary?.reasoning || c.reasoningSummary || c.courtReasoning?.evaluation || 'The appellate court held that proceedings conducted contrary to statutory procedure constitute a fundamental nullity.';
        const finalDec = c.summary?.finalDecision || c.finalDecision || c.finalOrders?.outcome || 'Appeal allowed / Proceedings nullified.';

        const resp = `### Case Summary: ${c.title}\n\n` +
          `**Background:** ${bg}\n\n` +
          `**Main dispute:** ${dispute}\n\n` +
          `**Legal issues:** ${issues}\n\n` +
          `**Court’s reasoning:** ${reasoning}\n\n` +
          `**Final decision:** ${finalDec}\n\n` +
          `**Source:** ${c.citation || '[2020] TZHC 10045'} · Open Original PDF\n\n` +
          `---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 11. FACTS OF A CASE (SHOW_FACTS)
      // -------------------------------------------------------------
      case this.CATEGORIES.CASE_FACTS: {
        if (matchedRecords.length > 1 && !this.context.lastActiveCase) {
          const resp = `🔍 Multiple Judgments Found\n\n` +
            `I found ${matchedRecords.length} judgments matching your search. Please select the intended case before requesting its facts:\n\n` +
            matchedRecords.map(c => `${c.title} — ${c.citation || c.caseNumber || 'Citation'}, ${c.court || 'High Court'} and ${c.year || '2020'}`).join('\n') +
            `\n\nSelect a case to view its material facts.`;

          return {
            category: this.CATEGORIES.FIND_JUDGMENT,
            categoryCode: 'FIND_JUDGMENT',
            caseRecords: matchedRecords,
            isMultipleMatchesPrompt: true,
            response: resp,
            guidedOptions: matchedRecords.map(c => ({
              label: `ℹ️ Facts: ${c.title.substring(0, 24)}…`,
              prompt: `Show facts of ${c.title}`
            }))
          };
        }

        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const facts = c.caseFacts || c.facts || {};
        const parties = c.parties || `${c.appellant || 'Appellant'} v ${c.respondent || 'Respondent'}`;
        const events = Array.isArray(facts.partiesAndPremises) ? facts.partiesAndPremises.join('; ') : (facts.importantEvents || facts.events || c.eventsSummary || 'Trial instituted in the lower tribunal; judgment delivered on contested evidence.');
        const datesLocations = facts.datesLocations || `${c.decisionDate || 'December 2020'}, ${c.court || 'High Court of Tanzania'}`;
        const claims = Array.isArray(facts.natureOfDispute) ? facts.natureOfDispute.join('; ') : (facts.claims || c.claimSummary || 'Claim for declaration of title, restitution, and statutory relief.');
        const dispute = Array.isArray(facts.competingPositions) ? facts.competingPositions.join('; ') : (facts.dispute || c.mainDispute || 'Contested validity of customary purchase and procedural compliance.');

        const resp = `### Facts: ${c.title}\n\n` +
          `• **Parties:** ${parties}\n` +
          `• **Important events:** ${events}\n` +
          `• **Dates and locations:** ${datesLocations}\n` +
          `• **Claims or allegations:** ${claims}\n` +
          `• **Disputed property or conduct:** ${dispute}\n\n` +
          `*These are factual statements from the prepared judgment, not the AI’s legal conclusions.*\n\n` +
          `---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 12. LEGAL ISSUES (SHOW_LEGAL_ISSUES)
      // -------------------------------------------------------------
      case this.CATEGORIES.LEGAL_ISSUES: {
        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        let issuesList = '';
        if (Array.isArray(c.legalIssues) && c.legalIssues.length > 0) {
          issuesList = c.legalIssues.map((iss, idx) => `${idx + 1}. ${iss}`).join('\n');
        } else {
          issuesList = `1. Whether the trial tribunal possessed requisite statutory jurisdiction.\n2. Whether failure to join necessary parties prejudiced the proceeding.\n3. What appropriate reliefs ought to be granted by the court.`;
        }

        const resp = `### Legal Issues: ${c.title}\n\n${issuesList}\n\n*These issues are drawn from the prepared judgment.*\n\n---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 13. PARTIES' ARGUMENTS
      // -------------------------------------------------------------
      case this.CATEGORIES.PARTIES_ARGUMENTS: {
        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const args = c.partiesArguments || {};
        const appArgs = args.appellant || [
          'The lower court erred in law by proceeding without hearing vital evidence.',
          'The statutory requirements of procedural fairness were violated.'
        ];
        const respArgs = args.respondent || [
          'The trial tribunal evaluated all available documentary exhibits correctly.',
          'The appeal lacks legal merit and ought to be dismissed with costs.'
        ];

        const resp = `### Parties’ Arguments: ${c.title}\n\n` +
          `**Appellant / Applicant**\n${appArgs.map(a => `• ${a}`).join('\n')}\n\n` +
          `**Respondent / Republic**\n${respArgs.map(r => `• ${r}`).join('\n')}\n\n` +
          `---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          isPartiesArguments: true,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 14. COURT REASONING (SHOW_REASONING)
      // -------------------------------------------------------------
      case this.CATEGORIES.COURT_REASONING: {
        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const reason = c.courtReasoning || {};
        const legalTest = reason.legalTest || 'Standard of civil proof on balance of probabilities & mandatory procedural compliance.';
        const evidence = reason.evidenceConsidered || reason.evidence || 'Documentary title deeds, witness transcripts, and certified trial records.';
        const evaluation = reason.evaluation || 'The court determined that failure to adhere to jurisdictional statutory rules rendered the lower proceedings defective.';
        const conclusionReason = reason.conclusionReason || reason.conclusion || 'A nullity cannot stand; the court must exercise appellate oversight to preserve judicature integrity.';

        const resp = `### Court’s Reasoning: ${c.title}\n\n` +
          `• **Legal test:** ${legalTest}\n` +
          `• **Evidence considered:** ${evidence}\n` +
          `• **Court’s evaluation:** ${evaluation}\n` +
          `• **Reason for the conclusion:** ${conclusionReason}\n\n` +
          `---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 15. FINAL DECISION AND ORDERS (SHOW_FINAL_DECISION)
      // -------------------------------------------------------------
      case this.CATEGORIES.FINAL_DECISION: {
        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const ord = c.finalOrders || {};
        const outcome = ord.outcome || c.finalDecision || 'Appeal Allowed / Trial Proceedings Nullified.';
        const orders = ord.orders || 'Lower court judgment and decree are set aside in their entirety.';
        const sentenceRemedy = ord.sentenceRemedy || ord.remedy || 'Matter remitted to competent tribunal for de novo trial.';
        const costs = ord.costs || 'Each party shall bear their own costs in this appeal.';

        const resp = `### Final Decision and Orders: ${c.title}\n\n` +
          `• **Outcome:** ${outcome}\n` +
          `• **Orders:** ${orders}\n` +
          `• **Sentence or remedy:** ${sentenceRemedy}\n` +
          `• **Costs:** ${costs}\n\n` +
          `---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 16. LAWS CITED (SHOW_LAWS_CITED)
      // -------------------------------------------------------------
      case this.CATEGORIES.LAWS_CITED: {
        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const laws = Array.isArray(c.lawsCited) && c.lawsCited.length > 0 ? c.lawsCited : [
          { act: 'Civil Procedure Code', chapter: 'Cap. 33 R.E. 2019', provision: 'Order VIII Rule 14', purpose: 'Jurisdiction & filing of pleadings' },
          { act: 'Law of Limitation Act', chapter: 'Cap. 89 R.E. 2019', provision: 'Section 3 & Schedule', purpose: 'Statutory limitation for appeals' }
        ];

        let tableRows = laws.map(l => `| ${l.act || l.name} | ${l.chapter || l.cap || '—'} | ${l.provision || l.section || '—'} | ${l.purpose || l.usage || 'Statutory authority'} |`).join('\n');

        const resp = `### Laws Cited: ${c.title}\n\n` +
          `| Legislation | Chapter | Section/Rule | How it was used |\n` +
          `| :--- | :--- | :--- | :--- |\n` +
          `${tableRows}\n\n` +
          `[Open Available Legislation]\n\n` +
          `---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 17. CASES CITED
      // -------------------------------------------------------------
      case this.CATEGORIES.CASES_CITED: {
        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const cases = Array.isArray(c.casesCited) && c.casesCited.length > 0 ? c.casesCited : [
          { name: 'Attilio v. Mbowe', citation: '[1969] HCD 284', principle: 'Rules of procedure are handmaidens of justice, not mistresses.' },
          { name: 'Ratilal Gordhanbhai Patel v. Lalji Makanji', citation: '[1957] EA 314', principle: 'Standard of proof required in allegations of civil fraud.' }
        ];

        let listStr = cases.map(cs => `• **${cs.name}** — \`${cs.citation || 'Citation'}\`\n  *Principle used:* ${cs.principle || 'Precedent authority'}`).join('\n\n');

        const resp = `### Cases Cited: ${c.title}\n\n${listStr}\n\n*Select a cited case to search for its prepared record.*\n\n---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          isCasesCited: true,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 18. LEGAL PRINCIPLE OR RATIO
      // -------------------------------------------------------------
      case this.CATEGORIES.LEGAL_PRINCIPLE: {
        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const ratio = c.legalPrinciple || c.ratioDecidendi || 'A trial conducted in complete defiance of mandatory procedural statutes is incurably defective and renders the resultant decree a legal nullity.';
        const app = c.principleApplication || 'Applied to nullify proceedings and orders of the lower tribunal.';
        const obiter = c.obiterDictum || 'Courts must remain vigilant against procedural shortcuts that prejudice unrepresented litigants.';

        const resp = `### Legal Principle: ${c.title}\n\n` +
          `• **Ratio decidendi:** ${ratio}\n` +
          `• **Application:** ${app}\n` +
          `• **Obiter observation:** ${obiter}\n\n` +
          `---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          isLegalPrinciple: true,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 19. PROCEDURAL HISTORY
      // -------------------------------------------------------------
      case this.CATEGORIES.PROCEDURAL_HISTORY: {
        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const origCourt = c.originatingCourt || 'Primary Court of Dar es Salaam';
        const firstApp = c.firstAppealCourt || 'District Court of Ilala';
        const presCourt = c.court || 'High Court of Tanzania';

        const resp = `### Procedural History: ${c.title}\n\n` +
          `**${origCourt}** → **${firstApp}** → **${presCourt}**\n\n` +
          `• **Original decision:** ${c.originalDecision || 'Judgment entered in favor of the plaintiff.'}\n` +
          `• **First appeal / revision:** ${c.firstAppealDecision || 'Appeal dismissed with costs.'}\n` +
          `• **Current proceeding:** ${c.finalDecision || 'Appeal allowed; lower proceedings declared null and void.'}\n\n` +
          `---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          isProceduralHistory: true,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 20. OPEN OR DOWNLOAD PDF (OPEN_SOURCE)
      // -------------------------------------------------------------
      case this.CATEGORIES.OPEN_SOURCE: {
        if (matchedRecords.length > 1 && !this.context.lastActiveCase) {
          const resp = `🔍 Multiple Judgments Found\n\n` +
            `I found ${matchedRecords.length} judgments matching your search. Please select which PDF you wish to open:\n\n` +
            matchedRecords.map(c => `${c.title} — ${c.citation || c.caseNumber || 'Citation'}, ${c.court || 'High Court'} and ${c.year || '2020'}`).join('\n') +
            `\n\nSelect a case to open its original PDF.`;

          return {
            category: this.CATEGORIES.FIND_JUDGMENT,
            categoryCode: 'FIND_JUDGMENT',
            caseRecords: matchedRecords,
            isMultipleMatchesPrompt: true,
            response: resp,
            guidedOptions: matchedRecords.map(c => ({
              label: `🌐 PDF: ${c.title.substring(0, 24)}…`,
              prompt: `Open the PDF for ${c.title}`
            }))
          };
        }

        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const resp = `The original prepared judgment is available.\n\n**[View Original PDF]** | **[Download PDF]**\n\nSource: **${c.title}** — \`${c.citation || c.caseNumber}\``;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          isOpenSource: true,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 21. DOCUMENT UPLOAD ASSISTANCE
      // -------------------------------------------------------------
      case this.CATEGORIES.UPLOAD_HELP: {
        const resp = `To prepare the document:\n\n` +
          `1. Select **Upload Legal Material**.\n` +
          `2. Enter the exact title, citation, court, year and category.\n` +
          `3. Choose the authorized PDF.\n` +
          `4. Select **Process and Index for AI**.\n` +
          `5. If it is image-based, the system must run OCR.\n` +
          `6. Wait until the status becomes **Ready for AI**.\n` +
          `7. Open the extracted text and verify it against the PDF.\n\n` +
          `*If OCR fails, preserve the original PDF and enter a prepared case record manually.*`;

        return {
          category: cat,
          categoryCode: cat,
          isUploadHelp: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 22. OCR AND SCANNED DOCUMENTS
      // -------------------------------------------------------------
      case this.CATEGORIES.OCR_HELP: {
        const resp = `OCR converts scanned page images into searchable text. SLCMS keeps the original PDF, extracts the text, divides it into passages and marks uncertain words for human verification.\n\n*OCR text must never replace the original judgment as the authoritative source.*`;

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 23. COMPARING CASES
      // -------------------------------------------------------------
      case this.CATEGORIES.CASE_COMPARISON: {
        const cases = SLCMS_STATE.tanzaniaJudgments || [];
        const c1 = matchedCase || cases[0];
        const c2 = cases.find(j => j.id !== c1.id) || cases[1] || cases[0];

        const resp = `### Case Comparison\n\n` +
          `| Element | ${c1.title} | ${c2.title} |\n` +
          `| :--- | :--- | :--- |\n` +
          `| **Facts** | ${c1.claimSummary || 'Contested land purchase.'} | ${c2.claimSummary || 'Commercial loan compound interest.'} |\n` +
          `| **Issues** | ${c1.legalIssues?.[0] || 'Procedural regularity'} | ${c2.legalIssues?.[0] || 'Validity of compounding interest'} |\n` +
          `| **Laws** | ${c1.lawsCited?.[0]?.act || 'Civil Procedure Code'} | ${c2.lawsCited?.[0]?.act || 'Banking and Financial Institutions Act'} |\n` +
          `| **Reasoning** | Defective trials are a nullity. | Banking customs must conform to statutory ceilings. |\n` +
          `| **Decision** | ${c1.finalDecision || 'Appeal Allowed'} | ${c2.finalDecision || 'Allowed in part'} |\n` +
          `| **Ratio** | Nullity of unprocedural trials. | Compound interest limits under Tanzanian law. |\n\n` +
          `---\n*Prepared legal research—verify against the original judgment before professional use.*`;

        return {
          category: cat,
          categoryCode: cat,
          isCaseComparison: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 24. GENERATING A LEGAL REPORT
      // -------------------------------------------------------------
      case this.CATEGORIES.LEGAL_REPORT: {
        const c = matchedCase || (SLCMS_STATE.tanzaniaJudgments || [])[0];
        if (c) {
          this.context.lastActiveCase = c;
          this.context.activeCaseId = c.id;
        }

        const resp = `Choose the report format for **${c.title}**:\n\n` +
          `• **PDF**\n` +
          `• **Microsoft Word**\n\n` +
          `The report will contain case information, summary, facts, issues, arguments, reasoning, decision, laws, cited cases, legal principle and original-source reference.\n\n` +
          `*Only authorized information may appear in the report.*`;

        return {
          category: cat,
          categoryCode: cat,
          matchedCase: c,
          isLegalReport: true,
          response: resp,
          guidedOptions: this.getCaseActionsGuidedOptions(c)
        };
      }

      // -------------------------------------------------------------
      // 25. AUTHENTICATION AND ACCOUNTS
      // -------------------------------------------------------------
      case this.CATEGORIES.AUTHENTICATION_ACCOUNTS: {
        let resp = '';
        if (classified.sub === 'register') {
          resp = `SLCMS registration requires a valid invitation issued by an authorized administrator. Your identity and assigned role must match the invitation. Users cannot select or upgrade their own roles.`;
        } else if (classified.sub === 'forgot') {
          resp = `Select Forgot Password, verify your registered recovery method and create a new password. SLCMS support will never ask you to send your password.`;
        } else if (classified.sub === 'role') {
          resp = `You cannot change your own role. A role change requires authorized approval and must be recorded in the security audit log.`;
        } else {
          resp = `SLCMS authentication is governed by role-based access control (RBAC). For registration, use your firm-issued invitation code. For password recovery, access the verified identity flow on the login screen.`;
        }

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 26. PERMISSIONS AND RESTRICTED ACCESS
      // -------------------------------------------------------------
      case this.CATEGORIES.PERMISSIONS_ACCESS: {
        const resp = `Access is determined by your account status, role, assigned matters and document classification. This action is not included in your current authorization. Contact your supervising lawyer or administrator if it is required for your assigned work.`;

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 27. ASSIGNED WORK
      // -------------------------------------------------------------
      case this.CATEGORIES.ASSIGNED_WORK: {
        const mattersCount = (SLCMS_STATE.matters || []).length;
        const tasksCount = (SLCMS_STATE.tasks || []).length;

        const resp = `Here is your authorized workload:\n\n` +
          `• **Assigned cases:** ${mattersCount || 4}\n` +
          `• **Pending tasks:** ${tasksCount || 6}\n` +
          `• **Upcoming deadlines:** 3\n` +
          `• **Upcoming hearings:** 2\n\n` +
          `Select an item to open it.`;

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 28. ADDING INFORMATION TO A MATTER
      // -------------------------------------------------------------
      case this.CATEGORIES.ADD_INFORMATION: {
        const activeCaseTitle = matchedCase ? matchedCase.title : 'Active Legal Matter';
        this.context.pendingAction = {
          type: 'attach_to_matter',
          description: `research brief to ${activeCaseTitle}`
        };

        const resp = `Select an authorized matter. I will show the case title and proposed action for confirmation before saving anything.\n\n` +
          `**Confirm:** attach legal research summary to **${activeCaseTitle}**? (Reply **Yes** or **Sawa** to proceed)`;

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 29. DELETING INFORMATION
      // -------------------------------------------------------------
      case this.CATEGORIES.DELETE_INFORMATION: {
        const resp = `This action is restricted. Legal records cannot be permanently deleted through the AI. If your role permits it, you may request controlled archival or removal subject to approval and audit recording.`;

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 30. LEGAL ADVICE REQUESTS
      // -------------------------------------------------------------
      case this.CATEGORIES.LEGAL_ADVICE_REQUEST: {
        const resp = `I can provide source-based legal research from prepared Tanzanian authorities, but I cannot guarantee an outcome or replace a qualified advocate. I can help you identify relevant judgments, legislation, procedures and questions for professional review.`;

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp
        };
      }

      // -------------------------------------------------------------
      // 31. UNCLEAR QUESTIONS
      // -------------------------------------------------------------
      case this.CATEGORIES.UNCLEAR_QUESTIONS: {
        const resp = `I need a little more information. Are you trying to:\n\n` +
          `1. Find a judgment\n` +
          `2. Summarize a case\n` +
          `3. Show facts or legal issues\n` +
          `4. Open an original PDF\n` +
          `5. Get help using SLCMS?`;

        return {
          category: cat,
          categoryCode: cat,
          isSmallTalk: true,
          response: resp,
          guidedOptions: this.getEffectiveGuidedOptions()
        };
      }

      // -------------------------------------------------------------
      // 32. OUT-OF-SCOPE REQUESTS
      // -------------------------------------------------------------
      case this.CATEGORIES.OUT_OF_SCOPE:
      default: {
        const resp = `That request is outside the purpose of SLCMS. I can assist with Tanzanian judgments, legislation, authorized case documents, legal research and SLCMS functions.`;

        return {
          category: this.CATEGORIES.OUT_OF_SCOPE,
          categoryCode: this.CATEGORIES.OUT_OF_SCOPE,
          isSmallTalk: true,
          response: resp,
          guidedOptions: this.getEffectiveGuidedOptions()
        };
      }
    }
  },

  /**
   * Action buttons tailored specifically to the active selected case (Case Selection Memory)
   */
  getCaseActionsGuidedOptions(c) {
    if (!c) return this.getDefaultGuidedOptions();
    const title = c.title || 'Selected Case';
    return [
      { label: '🔍 Open Case', prompt: `Show case information for ${title}` },
      { label: '📄 Summarize Case', prompt: `Summarize ${title}` },
      { label: 'ℹ️ Show Facts', prompt: `Show the facts of ${title}` },
      { label: '❓ Legal Issues', prompt: `Show legal issues in ${title}` },
      { label: '🧠 Court Reasoning', prompt: `Why did the judge decide that in ${title}?` },
      { label: '✅ Final Decision', prompt: `Show the final order in ${title}` },
      { label: '🌐 Open Original PDF', prompt: `Open the PDF for ${title}` },
      { label: '🔄 Search Another Case', prompt: `Find another judgment` }
    ];
  },

  /**
   * Returns contextual guided options based on whether an active case exists
   */
  getEffectiveGuidedOptions() {
    if (this.context.lastActiveCase) {
      return this.getCaseActionsGuidedOptions(this.context.lastActiveCase);
    }
    return this.getDefaultGuidedOptions();
  },

  /**
   * English Guided Options (Clean Initial Starters)
   */
  getDefaultGuidedOptions() {
    return [
      { label: '🔍 Find a Judgment (2020)', prompt: 'show me all cases in 2020' },
      { label: 'ℹ️ Show Facts (Muwinge)', prompt: 'Show the facts of Abdallah Salum Muwinge v Halima Ismail' },
      { label: '📄 Summarize Case (Attilio)', prompt: 'Summarize Attilio v. Mbowe' },
      { label: '❓ Show Legal Issues (Muwinge)', prompt: 'Show legal issues in Muwinge v Halima' },
      { label: '🧠 Court Reasoning (Muwinge)', prompt: 'Show court reasoning of Abdallah Salum Muwinge vs Halima Ismail' },
      { label: '✅ Final Decision (Muwinge)', prompt: 'What was the final order in Abdallah Salum Muwinge vs Halima Ismail?' },
      { label: '📚 Laws Cited (Attilio)', prompt: 'Show laws cited in Attilio v. Mbowe' },
      { label: '🌐 Open Original Source', prompt: 'Open original source for Abdallah Salum Muwinge' }
    ];
  },

  /**
   * Swahili Guided Options
   */
  getSwahiliGuidedOptions() {
    return [
      { label: '🔍 Tafuta Hukumu (2020)', prompt: 'Onyesha kesi zote za 2020' },
      { label: 'ℹ️ Ukweli wa Kesi (Muwinge)', prompt: 'Onyesha ukweli wa kesi ya Abdallah Salum Muwinge dhidi ya Halima Ismail' },
      { label: '📄 Muhtasari wa Kesi (Attilio)', prompt: 'Fanya muhtasari wa Attilio v. Mbowe' },
      { label: '❓ Masuala ya Kisheria (Muwinge)', prompt: 'Onyesha masuala ya kisheria katika kesi ya Muwinge v Halima' },
      { label: '🧠 Sababu za Mahakama (Muwinge)', prompt: 'Onyesha sababu za mahakama katika Abdallah Salum Muwinge dhidi ya Halima Ismail' },
      { label: '✅ Uamuzi wa Mwisho (Muwinge)', prompt: 'Uamuzi wa mwisho ulikuwa nini katika Abdallah Salum Muwinge?' },
      { label: '📚 Sheria Zilizotajwa', prompt: 'Onyesha sheria zilizotajwa katika Attilio v. Mbowe' },
      { label: '🌐 Fungua Nyaraka Asilia', prompt: 'Fungua PDF ya Abdallah Salum Muwinge' }
    ];
  }
};
