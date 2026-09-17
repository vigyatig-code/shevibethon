export type Language = 'en' | 'hi'

export const LANG_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
}

export const LANG_CODES: Record<Language, string> = {
  en: 'en-US',
  hi: 'hi-IN',
}

// Hindi voice quality for text-to-speech depends on the user's browser/OS
// having a Hindi voice installed — Chrome on Android and Windows generally
// have one built in, but availability varies. If no Hindi voice is found we
// fall back to whatever default voice is available; the language code alone
// (hi-IN) still helps pronunciation even without a native voice.
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: Language
): SpeechSynthesisVoice | undefined {
  const code = LANG_CODES[lang]
  return voices.find((v) => v.lang === code) || voices[0]
}

// ─── Voice form prompts ──────────────────────────────────────────────────

export interface PromptMap {
  intro: string
  name: string
  email: string
  subject: string
  description: string
  saved: string
  done: string
  spellIntro: string
  spellHeard: string
  spellRemoved: string
  spellStartOver: string
  spellCatch: string
  spellInvalid: string
  tryAgain: string
  heardInvalid: string
  heardInvalidSpell: string
  confirmPrompt: string
  confirmGeneric: string
  confirmSpellable: string
  stillListening: string
  confirmTimeout: string
  // Accessibility page specific
  audioWelcome: string
  audioStep1: string
  audioStep2: string
  audioStep3: string
  audioStep4: string
  audioStep5: string
  audioStep6: string
  audioStep7: string
  voiceHint: string
  voiceApology: string
  voiceNoSpeech: string
  voiceNotAllowed: string
  voiceMicLabel: string
  voiceMicListening: string
  voiceSayHint: string
}

export const PROMPTS: Record<Language, PromptMap> = {
  en: {
    intro: "Let's fill out the form together, one step at a time. There's no rush at all — take as many tries as you need on each question. After each answer, say \"final\" when you are happy with it.",
    name: "What is your full name? Take your time — there's no rush at all.",
    email: "What is your email address? You can say it naturally, like: john dot smith at gmail dot com. Take your time.",
    subject: 'What is a brief title for your complaint? Just say it in a few words.',
    description: 'Please describe the issue in your own words. There is no rush — take as long as you need.',
    saved: "Great, that's saved.",
    done: 'All done — thank you for your patience. Please take a moment to review the form, then submit whenever you are ready.',
    spellIntro: `Okay, let's spell it out together, one letter at a time. Say "at" for the at sign, "dot" for a period, "delete" to remove the last letter, and "final" whenever you are done.`,
    spellHeard: 'Okay, removed. Go ahead with the next letter.',
    spellStartOver: 'Okay, starting this field over. Go ahead and spell it from the beginning.',
    spellCatch: "Sorry, I didn't quite catch that letter. Could you say it once more?",
    spellRemoved: 'Okay, removed. Go ahead with the next letter.',
    spellInvalid: `That's put together as {val}, but it doesn't look quite complete for your {label}. Let's keep spelling — go ahead.`,
    tryAgain: "No problem, let's try that again.",
    heardInvalid: `I heard "{val}", but I am not fully sure that is right for your {label}. Would you like to spell it out instead? Just say "spell it", or try saying it again.`,
    confirmPrompt: "Take your time — just say 'final' when you are happy with it, or try again.",
    confirmGeneric: `Say "final" if that is correct, or just say it again to redo it.`,
    confirmSpellable: `Say "final" if that is correct, "spell it" to spell it out letter by letter, or just say it again to redo it.`,
    stillListening: "Take your time. I am still listening whenever you are ready.",
    confirmTimeout: "Take your time — just say 'final' when you are happy with it, or try again.",
    audioWelcome: 'Welcome to the Accessibility page. This audio guide will walk you through each step of submitting a report.',
    audioStep1: 'Step 1. Select your disability type. Tap one of the cards below. For example, Visual Impairment, Hearing Impairment, Mobility, Cognitive, or Multiple Disabilities. This is optional but helps us categorize your report.',
    audioStep2: 'Step 2. Choose a common issue. When you select a disability type, a bubble menu will appear with common issues. Tap a bubble to select the issue that best matches your situation. This will fill in the subject field for you.',
    audioStep3: 'Step 3. Enter your full name and email address in the contact section. These are required so we can follow up with you about your report.',
    audioStep4: 'Step 4. Review the subject field. If you selected an issue from the bubbles, it is already filled in. You can also type your own subject if you prefer.',
    audioStep5: 'Step 5. Write a detailed description of the accessibility barrier or issue you experienced. The more detail you provide, the better we can help.',
    audioStep6: 'Step 6. Optionally, add a photo. Tap the upload area to select an image from your device. This helps us see the problem directly.',
    audioStep7: 'Step 7. When you are ready, tap the Submit Report button at the bottom. Your report will be submitted with high priority and you will receive a tracking number to check its status later.',
    voiceHint: 'Try saying: "visual impairment", "hearing", "mobility", "cognitive", or "multiple disabilities"',
    voiceApology: `Sorry, I didn't catch that. I heard "{val}". Please try saying visual, hearing, mobility, cognitive, or multiple.`,
    voiceNoSpeech: 'No speech detected. Please try again.',
    voiceNotAllowed: 'Microphone access denied. Please allow microphone access and try again.',
    voiceMicLabel: 'Say your disability type',
    voiceMicListening: 'Listening... Tap to stop',
    voiceSayHint: 'Try saying: "visual impairment", "hearing", "mobility", "cognitive", or "multiple disabilities"',
  },
  hi: {
    intro: 'चलो फॉर्म को एक साथ भरते हैं, एक-एक करके। कोई जल्दी नहीं है — हर सवाल पर जितनी बार चाहें इतनी कोशिश करें। हर जवाब के बाद, जब आप संतुष्ट हों तो "पक्का" बोलें।',
    name: 'आपका पूरा नाम क्या है? अपनी गति से बोलिए — कोई जल्दी नहीं है।',
    email: 'आपका ईमेल पता क्या है? आप इसे स्वाभाविक रूप से बोल सकते हैं, जैसे: john dot smith at gmail dot com।',
    subject: 'आपकी शिकायत का संक्षिप्त शीर्षक क्या है? बस कुछ शब्दों में बोलिए।',
    description: 'कृपया अपने शब्दों में समस्या का वर्णन करें। कोई जल्दी नहीं है — जितना समय चाहिए लीजिए।',
    saved: 'बढ़िया, यह सहेज लिया गया।',
    done: 'सब हो गया — आपके धैर्य के लिए धन्यवाद। कृपया फॉर्म देख लें, फिर जब तैयार हों तब सबमिट करें।',
    spellIntro: 'ठीक है, चलो एक-एक अक्षर करके बताते हैं। "at" बोलें एट साइन के लिए, "dot" बोलें डॉट के लिए, "delete" बोलें पिछला अक्षर हटाने के लिए, और "पक्का" बोलें जब हो जाए।',
    spellHeard: 'ठीक है, हटा दिया। अगला अक्षर बोलिए।',
    spellStartOver: 'ठीक है, इसे फिर से शुरू करते हैं। शुरुआत से बताइए।',
    spellCatch: 'माफ़ कीजिए, वह अक्षर ठीक से नहीं सुनाई दिया। एक बार फिर बोलिए?',
    spellRemoved: 'ठीक है, हटा दिया। अगला अक्षर बोलिए।',
    spellInvalid: 'यह {val} बनता है, लेकिन आपका {label} अभी पूरा नहीं लगता। चलो और बताइए — आगे बोलिए।',
    tryAgain: 'कोई बात नहीं, फिर से कोशिश करते हैं।',
    heardInvalid: 'मैंने "{val}" सुना, लेकिन मुझे पक्का नहीं है कि यह आपका {label} सही है। क्या आप इसे एक-एक करके बताना चाहेंगे? "स्पेल करें" बोलिए, या फिर से बोलिए।',
    confirmPrompt: 'अपनी गति से — जब संतुष्ट हों तो "पक्का" बोलिए, या फिर से कोशिश करें।',
    confirmGeneric: 'सही हो तो "पक्का" बोलिए, या फिर से बोलिए।',
    confirmSpellable: 'सही हो तो "पक्का" बोलिए, "स्पेल करें" बोलें एक-एक करके बताने के लिए, या फिर से बोलिए।',
    stillListening: 'अपनी गति से। मैं सुन रहा हूँ, जब तैयार हों तब बोलिए।',
    confirmTimeout: 'अपनी गति से — जब संतुष्ट हों तो "पक्का" बोलिए, या फिर से कोशिश करें।',
    audioWelcome: 'एक्सेसिबिलिटी पेज पर आपका स्वागत है। यह ऑडियो गाइड आपको रिपोर्ट दर्ज करने के हर चरण में मदद करेगी।',
    audioStep1: 'चरण 1। अपनी विकलांगता का प्रकार चुनें। नीचे कार्ड में से एक टैप करें। जैसे दृष्टि, सुनना, चलना, मानसिक, या एकाधिक विकलांगता। यह वैकल्पिक है लेकिन हमें आपकी रिपोर्ट वर्गीकृत करने में मदद करता है।',
    audioStep2: 'चरण 2। एक सामान्य समस्या चुनें। जब आप विकलांगता प्रकार चुनते हैं, तो बबल मेन्यू में सामान्य समस्याएँ दिखेंगी। बबल टैप करके अपनी समस्या चुनें। यह विषय फ़ील्ड भर देगा।',
    audioStep3: 'चरण 3। संपर्क अनुभाग में अपना पूरा नाम और ईमेल पता दर्ज करें। ये आवश्यक हैं ताकि हम आपसे आपकी रिपोर्ट के बारे में संपर्क कर सकें।',
    audioStep4: 'चरण 4। विषय फ़ील्ड देखें। यदि आपने बबल से समस्या चुनी है तो यह पहले से भरा होगा। आप अपना विषय खुद भी टाइप कर सकते हैं।',
    audioStep5: 'चरण 5। आपने जो एक्सेसिबिलिटी बाधा या समस्या अनुभव की, उसका विस्तार से वर्णन करें। जितना अधिक विवरण, उतनी बेहतर मदद।',
    audioStep6: 'चरण 6। वैकल्पिक रूप से, एक फ़ोटो जोड़ें। अपलोड क्षेत्र टैप करके अपनी डिवाइस से चित्र चुनें। इससे हमें समस्या सीधे देखने में मदद मिलती है।',
    audioStep7: 'चरण 7। जब तैयार हों, तब नीचे सबमिट रिपोर्ट बटन टैप करें। आपकी रिपोर्ट उच्च प्राथमिकता के साथ दर्ज होगी और आपको ट्रैकिंग नंबर मिलेगा।',
    voiceHint: 'बोलिए: "दृष्टि विकलांगता", "सुनना", "चलना", "मानसिक", या "एकाधिक विकलांगता"',
    voiceApology: 'माफ़ कीजिए, समझ नहीं आया। मैंने "{val}" सुना। कृपया दृष्टि, सुनना, चलना, मानसिक, या एकाधिक बोलने की कोशिश करें।',
    voiceNoSpeech: 'कोई आवाज़ नहीं सुनाई दी। कृपया फिर कोशिश करें।',
    voiceNotAllowed: 'माइक्रोफ़ोन एक्सेस अस्वीकृत। कृपया माइक्रोफ़ोन एक्सेस दें और फिर कोशिश करें।',
    voiceMicLabel: 'अपनी विकलांगता का प्रकार बोलिए',
    voiceMicListening: 'सुन रहा हूँ... रोकने के लिए टैप करें',
    voiceSayHint: 'बोलिए: "दृष्टि विकलांगता", "सुनना", "चलना", "मानसिक", या "एकाधिक विकलांगता"',
  },
}

// ─── Keyword matching ───────────────────────────────────────────────────

export const FINAL_WORDS: Record<Language, string[]> = {
  en: ['final', 'finalize', "that's final", 'lock it in', 'confirm final'],
  hi: ['पक्का', 'final', 'finalize', 'confirm', 'ठीक है', 'सही है'],
}

export const REDO_WORDS: Record<Language, string[]> = {
  en: ['redo', 'again', 'try again', 'start over', 'no'],
  hi: ['नहीं', 'फिर से', 'दोबारा', 'redo', 'again'],
}

export const SPELL_WORDS: Record<Language, string[]> = {
  en: ['spell', 'spell it', 'let me spell', 'spell it out'],
  hi: ['स्पेल करें', 'स्पेल', 'एक-एक करके', 'spell'],
}

export const YES_WORDS: Record<Language, string[]> = {
  en: ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay'],
  hi: ['हाँ', 'हां', 'जी', 'ठीक है', 'yes', 'ok'],
}

export const NO_WORDS: Record<Language, string[]> = {
  en: ['no', 'nope', 'nah', 'nay'],
  hi: ['नहीं', 'ना', 'no'],
}

export function containsAny(text: string, words: string[]): boolean {
  const t = text.toLowerCase()
  return words.some((w) => t.includes(w.toLowerCase()))
}

export function getPrompts(lang: Language): PromptMap {
  return PROMPTS[lang]
}
