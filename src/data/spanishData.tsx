import type { Lesson } from "@/data/types"
import words from "./spanishWords"
// Optional plural surface helper
import { asPlural } from "@/lib/wordForms"

const { conj, pron, prep, advrb, noun, verb, artcl } = words

// ---------------------------------------------------------------------------
// Lightweight reference mapping helper
// Purpose: avoid manually re-typing deep string paths + index arrays in each
// sentence's `reference` field. Keeps current system intact while improving
// authoring ergonomics.
// ---------------------------------------------------------------------------

type ReferenceEntry = { path: string; indices: number[] }

// Add new items here as needed. "indices" corresponds to the positions inside
// the relevant word's .info array you want to surface for that mistake/context.
// Naming convention: camelCase describing the pedagogical concept.
const referenceMap = {
	attributeLo: {
		path: "pron.attribute.words.lo",
		indices: [1],
	} as ReferenceEntry,
	noContractions: {
		path: "advrb.words.no",
		indices: [6],
	} as ReferenceEntry,
	dObjPosition: {
		path: "pron.dObj",
		indices: [1],
	} as ReferenceEntry,
	serIdentity: {
		path: "verb.words.ser",
		indices: [7],
	} as ReferenceEntry,
	serOrigin: {
		path: "verb.words.ser",
		indices: [1],
	} as ReferenceEntry,
	paraSer: {
		path: "prep.words.para",
		indices: [6],
	} as ReferenceEntry,
	porBecauseOf: {
		path: "prep.words.por",
		indices: [3],
	} as ReferenceEntry,
	serBeing: {
		path: "verb.words.ser",
		indices: [8],
	} as ReferenceEntry,
	serNoArticle: {
		path: "verb.words.ser",
		indices: [9],
	} as ReferenceEntry,
	porQueWhy: {
		path: "prep.words.por",
		indices: [10],
	} as ReferenceEntry,
	serNoLocation: {
		path: "verb.words.ser",
		indices: [5],
	} as ReferenceEntry,
	serNoDoing: {
		path: "verb.words.ser",
		indices: [6],
	} as ReferenceEntry,
	noDoContractions: {
		path: "advrb.words.no",
		indices: [7],
	} as ReferenceEntry,
	dePossessionContractions: {
		path: "prep.words.de",
		indices: [3],
	} as ReferenceEntry,
	dePossession: {
		path: "prep.words.de",
		indices: [2],
	} as ReferenceEntry,
	deMaterial: {
		path: "prep.words.de",
		indices: [4],
	} as ReferenceEntry,
	prepPosition: {
		path: "prep",
		indices: [2],
	} as ReferenceEntry,
	porAndSer: {
		path: "prep.words.por",
		indices: [12],
	} as ReferenceEntry,
	aAndTime: {
		path: "prep.words.a",
		indices: [0],
	} as ReferenceEntry,
	paraQueConj: {
		path: "prep.words.para",
		indices: [5],
	} as ReferenceEntry,
	paraQuePron: {
		path: "prep.words.para",
		indices: [4],
	} as ReferenceEntry,
	serPhysical: {
		path: "verb.words.ser",
		indices: [4],
	} as ReferenceEntry,
	queAsThan: {
		path: "conj.words.que",
		indices: [3],
	} as ReferenceEntry,
	porLocation: {
		path: "prep.words.por",
		indices: [5],
	} as ReferenceEntry,
	porEso: {
		path: "prep.words.por",
		indices: [9],
	} as ReferenceEntry,
	paraFor: {
		path: "prep.words.para",
		indices: [0],
	} as ReferenceEntry,
	porFor: {
		path: "prep.words.por",
		indices: [11],
	} as ReferenceEntry,
	queExclamation: {
		path: "pron.interrogative.words.que",
		indices: [0],
	} as ReferenceEntry,
	porAlong: {
		path: "prep.words.por",
		indices: [6],
	} as ReferenceEntry,
	queConnector: {
		path: "conj.words.que",
		indices: [1],
	} as ReferenceEntry,
	paraDeadlines: {
		path: "prep.words.para",
		indices: [2],
	} as ReferenceEntry,
	porCauseBy: {
		path: "prep.words.por",
		indices: [13],
	} as ReferenceEntry,
	porDuring: {
		path: "prep.words.por",
		indices: [8],
	} as ReferenceEntry,
	noDo: {
		path: "verb",
		indices: [12],
	} as ReferenceEntry,
	usted3rdPerson: {
		path: "pron.subject.usted",
		indices: [0],
	} as ReferenceEntry,
	ustedNoPronoun: {
		path: "pron.subject.usted",
		indices: [1],
	} as ReferenceEntry,
	ustedDirectObject: {
		path: "pron.dObj.usted",
		indices: [2],
	} as ReferenceEntry,
	estarHowAndWhere: {
		path: "verb.words.estar",
		indices: [0],
	} as ReferenceEntry,
	noVerbPosition: {
		path: "advrb.words.no",
		indices: [9],
	} as ReferenceEntry,
	noVerbPhrasePosition: {
		path: "advrb.words.no",
		indices: [8],
	} as ReferenceEntry,
	estarBeing: {
		path: "verb.words.estar",
		indices: [1],
	} as ReferenceEntry,
	estarPresent: {
		path: "verb.words.estar",
		indices: [2],
	} as ReferenceEntry,
	paraInOrder: {
		path: "prep.words.para",
		indices: [7],
	} as ReferenceEntry,
	serProfession: {
		path: "verb.words.ser",
		indices: [9],
	} as ReferenceEntry,
	subjunctiveIntentionQue: {
		path: "verb",
		indices: [13],
	} as ReferenceEntry,
	noSubjunctive: {
		path: "verb",
		indices: [14],
	} as ReferenceEntry,
	subjunctiveNoBe: {
		path: "verb",
		indices: [15],
	} as ReferenceEntry,
	queWithSubjunctive: {
		path: "conj.words.que",
		indices: [4],
	} as ReferenceEntry,
} as const

type ReferenceKey = keyof typeof referenceMap

// Build a reference object from one or more keys.
// Usage: reference: ref("attributeLo") OR reference: ref("attributeLo", "adverbNoContractions")
const ref = (...keys: ReferenceKey[]): Record<string, number[]> =>
	keys.reduce((acc, k) => {
		const { path, indices } = referenceMap[k]
		acc[path] = indices
		return acc
	}, {} as Record<string, number[]>)

// If you need the raw mapping (e.g., tooling / validation) you can export later.
// export { referenceMap, ref }

// (compat removed) All references migrated to new pron.* paths

// const sideLessonPotential = [
// 	{
// 		lesson: 1,
// 		info: "general intro, info",
// 	},
// 	{
// 		lesson: 2,
// 		info: "FOOD test, EAT test, Potato head game.",
// 	},
// 	{
// 		lesson: 6,
// 		info: [
// 			"Find the direct object",
// 			"explains positions of NO vs Direct Obj pronouns",
// 		],
// 	},
// 	{
// 		lesson: 8,
// 		info: [
// 			"Find the direct object PRONOUN",
// 			"Direct obj Pronoun memory palace",
// 			"explains posisitions of direct object vs direct object pronouns",
// 		],
// 	},
// 	{
// 		lesson: 12,
// 		info: ["Guess if is is being used as ES"],
// 	},
// 	{
// 		lesson: 13,
// 		info: ["Ser memory palace"],
// 	},
// ]

const spanishData: { lessons: Lesson[] } = {
	lessons: [
		{
			lesson: 1,
			name: "Lesson 1",
			details: "INTRO: A Grammatical Approach to Language Learning",
			info: [
				"This language course is focused on reuslts and genuine fluency. \nThe aim is to have you thinking in Spanish ASAP, and from there sounding more like a native speaker every day.",
				"Vocab will always make contextual sense. Grammar rules will ALWAYS integrate with what you already know, helping you to naturally form sentences. \nEvery new word will fit into a fabric that will quickly grow and develop into your SPANISH VOICE so that you can speak Idiomatically faster than ever!",
				"This all requires doing the work, step by step from the foundations and working your way up. This requires the mindset of a SERIOUS language learner. ",
				"This program is not focused on vocab, so we won't be learning words for 'tree' or 'napkin' right away, we need to focus on the core elements of the language EXCLUSIVELY first.",
				"This course starts with some hard concepts in Spanish, like essential sentence structures, pronouns, prepositions, irregular verb conjugations, and everything that makes Spanish what it is!",
				"Don't worry though there will by systems involved to help master all of these foundations until they are second nature!",
				"Once you know how to fit Spanish words into sentences we can learn all the vocab that fits into those sentence constructs and idioms.",
				"We actually will be learning the most frequently used Spanish words first, leaning all the words needed to get to 90% comprehension and enabling you to express literally anything you to express in Spanish.",
				"You might not know the word for Office Printer in spanish but you'll be able to describe this thing and ask what it is called, giving you a new vocab word on the spot!",
				"You'll learn fastest if you take an opportunity to predict the Spanish you're about to translate outloud, and especially speak it out loud, trying to imitate the audio!",
				"One of the most important objectives on the road to fluency is SPONTANEOUS PRODUCTION, coming up with your own sentences on the fly, in a smooth way. Practice changing the sentences and making them your own as well!",
			],
			wordBank: [],
			sentences: [],
		},
		{
			lesson: 2,
			name: "Lesson 2",
			details: "Deep foundational grammar!",
			info: [
				"What is deep fundamental grammar? Well you can't build a house from scratch, you need a foundation first. During the first 10 lessons we are going to build (or rebuild) your Spanish SYNTAX and GRAMMAR from their roots. This will be some of the hardest work in the course ",
				"We will be spending a lot of time on only a few words. In fact 20 words make up 30% of ALL words spoken in Spanish, and about 100 words make up over 50%!",
				"We will be focusing on the first 20. Not just what they mean, but how to use them in a sentence like a Native Speaker would!",
				"Fluency is all about being able to say what you want in Spanish in real time, and you need to not just recite memorized phrases, but create entire Spanish sentences from scratch!",
				"However, actually no one really assembles sentences from scratch, Every real sentence, both in English and Spanish, is actually based on an existing template that Native Speakers use all the time!",
				"Think of the sentence template like a potato head face, all the parts can be changed, the eyes, nose, mouth, you can replace the hat with hair.",
				"But the potato head has a basic structure, on top is hair or a hat of some kind, then the eyes, nose, mouth, it wouldn't be proper to place the mouth on the head.",
				"Sentences function in the same way, there is a basic template, but certain pieces are interchangeable. The parts in a sentence are called parts of speech, and two types are NOUNS and VERBS",
				"Nouns and verbs function very much the same in English as in Spanish but not quite exactly. Let's review nouns and verbs, how to identify them, and how to use them in a Spanish sentence template.",
				noun.info[1],
				noun.info[0],
				`ESO is technically not a NOUN it's a PRONOUN meaning THAT. ${pron.demonstrative.words.eso.info[0]}`,
				`Any noun or noun phrase can be replaced with ESO and still make sense: 'Losing myself in a new city makes me happy' 'That/ESO makes me happy'`,

				verb.info[0],
				verb.info[1],
				verb.info[2],
			],
			wordBank: [],
			sentences: [],
		},
		{
			lesson: 3,
			name: "Lesson 3",
			details: "Conjunctions (Y and QUE) and ESO",
			info: [
				conj.info[0],
				conj.info[1],
				conj.words.que.info[0],
				conj.words.que.info[1],
				verb.info[3],
				conj.words.y.info[0],
			],
			wordBank: [conj.words.y, conj.words.que, pron.demonstrative.words.eso],
			sentences: [
				{
					id: 1,
					sentence: "She and I want that",
					translation: "She Y I want ESO",
					data: [
						{ phrase: "She" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "I" },
						{ phrase: "want" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 2,
					sentence: "We said that was fine",
					translation: "We said QUE ESO was fine",
					data: [
						{
							phrase: "We said",
							translation: conj.words.que,
							phraseTranslation: "We said QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "was" },
						{ phrase: "fine" },
					],
				},
				{
					id: 3,
					sentence: "I hope that that is OK",
					translation: "I hope QUE ESO is OK",
					data: [
						{ phrase: "I" },
						{ phrase: "hope" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "is" },
						{ phrase: "OK" },
					],
				},
				{
					id: 4,
					sentence: "People say that it's good",
					translation: "People say QUE its good",
					data: [
						{ phrase: "People" },
						{ phrase: "say" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "it's" },
						{ phrase: "good" },
					],
				},
				{
					id: 5,
					sentence: "We said that that was fine!",
					translation: "We said QUE ESO was fine!",
					data: [
						{ phrase: "We" },
						{ phrase: "said" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "was" },
						{ phrase: "fine" },
					],
				},
				{
					id: 6,
					sentence: "I told them that was in the way",
					translation: "I told them QUE ESO was in the way",
					data: [
						{
							phrase: "I told them",
							translation: conj.words.que,
							phraseTranslation: "I told them QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "was" },
						{ phrase: "in" },
						{ phrase: "the" },
						{ phrase: "way" },
					],
				},
				{
					id: 7,
					sentence: "I hope he gets that soon",
					translation: "I hope QUE he gets ESO soon",
					data: [
						{
							phrase: "I hope",
							translation: conj.words.que,
							phraseTranslation: "I hope QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "he" },
						{ phrase: "gets" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "soon" },
					],
				},
				{
					id: 8,
					sentence: "I don't want that here!",
					translation: "I don't want ESO here!",
					data: [
						{ phrase: "I" },
						{ phrase: "don't" },
						{ phrase: "want" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "here" },
					],
				},
				{
					id: 9,
					sentence: "He said they said that!",
					translation: "He said QUE they said ESO!",
					data: [
						{
							phrase: "He said",
							translation: conj.words.que,
							phraseTranslation: "He said QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "they" },
						{ phrase: "said" },
						{ phrase: "that!", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 10,
					sentence: "I said this and she said that",
					translation: "I said this Y she said ESO",
					data: [
						{ phrase: "I" },
						{ phrase: "said" },
						{ phrase: "this" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "she" },
						{ phrase: "said" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 11,
					sentence: "They found that?",
					translation: "They found ESO?",
					data: [
						{ phrase: "They" },
						{ phrase: "found" },
						{ phrase: "that?", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 12,
					sentence: "That isn't my favorite thing",
					translation: "ESO isn't my favorite thing",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{ phrase: "isn't my favorite thing" },
					],
				},
				{
					id: 13,
					sentence: "I told him that we arrived",
					translation: "I told him QUE we arrived",
					data: [
						{ phrase: "I told him" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "we" },
						{ phrase: "arrived" },
					],
				},
				{
					id: 14,
					sentence: "I hope that you have a nice day",
					translation: "I hope QUE you have a nice day",
					data: [
						{ phrase: "I hope" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "you" },
						{ phrase: "have" },
						{ phrase: "a" },
						{ phrase: "nice" },
						{ phrase: "day" },
					],
				},
				{
					id: 15,
					sentence: "We want that as soon as possible",
					translation: "We want ESO as soon as possible",
					data: [
						{ phrase: "We" },
						{ phrase: "want" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "as soon as possible" },
					],
				},
				{
					id: 16,
					sentence: "They told me that that was impossible",
					translation: "They told me QUE ESO was impossible",
					data: [
						{ phrase: "They" },
						{ phrase: "told" },
						{ phrase: "me" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "was" },
						{ phrase: "impossible" },
					],
				},
				{
					id: 17,
					sentence: "I dreamed that I was back in highschool",
					translation: "I dreamed QUE I was back in highschool",
					data: [
						{ phrase: "I" },
						{ phrase: "dreamed" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "I" },
						{ phrase: "was" },
						{ phrase: "back" },
						{ phrase: "in" },
						{ phrase: "highschool" },
					],
				},
				{
					id: 18,
					sentence: "I hope he told you he was here",
					translation: "I hope QUE he told you QUE he was here",
					data: [
						{
							phrase: "I hope",
							translation: conj.words.que,
							phraseTranslation: "I hope QUE",
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "he told you",
							translation: conj.words.que,
							phraseTranslation: "he told you QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "he was here" },
					],
				},
			],
		},
		{
			lesson: 4,
			name: "Lesson 4",
			details: "Prepositions: DE and A, Adverb NO ",
			info: [
				"De and A are very common prepositions, meaning of or from, and to",
				prep.info[0],
				prep.words.de.info[0],
				`No is an adverb. ${advrb.words.no.info[0]}`,
				advrb.words.no.info[1],
				advrb.words.no.info[2],
				advrb.words.no.info[3],
				advrb.words.no.info[8],
				advrb.words.no.info[5],
			],
			wordBank: [advrb.words.no, prep.words.de, prep.words.a],
			sentences: [
				{
					id: 1,
					sentence: "She can't be at the house",
					translation: "She NO can be at the house",
					data: [
						{ phrase: "She" },
						{
							phrase: "can't be",
							translation: advrb.words.no,
							phraseTranslation: "NO can be",
							reference: { "advrb.words.no": [7] },
						},
						{ phrase: "at" },
						{ phrase: "the" },
						{ phrase: "house" },
					],
				},
				{
					id: 2,
					sentence: "Don't say you're not here",
					translation: "NO say QUE you NO are here",
					data: [
						{
							phrase: "Don't say",
							translation: [advrb.words.no, conj.words.que],
							phraseTranslation: "NO say QUE",
							reference: { "advrb.words.no": [7], "conj.words.que": [1] },
						},
						{
							phrase: "you're not",
							translation: advrb.words.no,
							phraseTranslation: "you NO are",
							reference: ref("noContractions"),
						},
						{ phrase: "here" },
					],
				},
				{
					id: 3,
					sentence: "We didn't go to this store",
					translation: "We NO went A this store",
					data: [
						{ phrase: "We" },
						{
							phrase: "didn't go",
							translation: advrb.words.no,
							phraseTranslation: "NO went",
							reference: { "advrb.words.no": [7] },
						},
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "this" },
						{ phrase: "store" },
					],
				},
				{
					id: 4,
					sentence: "She won't send that to her sister",
					translation: "She NO will send ESO A her sister",
					data: [
						{ phrase: "She" },
						{
							phrase: "won't send",
							translation: advrb.words.no,
							phraseTranslation: "NO will send",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "her" },
						{ phrase: "sister" },
					],
				},
				{
					id: 5,
					sentence: "Are you tired of doing that?",
					translation: "Are you tired DE doing ESO?",
					data: [
						{ phrase: "Are" },
						{ phrase: "you" },
						{ phrase: "tired" },
						{ phrase: "of", translation: prep.words.de },
						{ phrase: "doing" },
						{ phrase: "that?", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 6,
					sentence: "This isn't your stuff",
					translation: "This NO is your stuff",
					data: [
						{ phrase: "This" },
						{
							phrase: "isn't",
							translation: advrb.words.no,
							phraseTranslation: "NO is",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "your" },
						{ phrase: "stuff" },
					],
				},
				{
					id: 7,
					sentence: "We can't do that",
					translation: "We NO can do ESO",
					data: [
						{ phrase: "We" },
						{
							phrase: "can't do",
							translation: advrb.words.no,
							phraseTranslation: "NO can do",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 8,
					sentence: "He and I drove from this place",
					translation: "He Y I drove DE this place",
					data: [
						{ phrase: "He" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "I" },
						{ phrase: "drove" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "this" },
						{ phrase: "place" },
					],
				},
				{
					id: 9,
					sentence: "I can't have more of that",
					translation: "I NO can have more of ESO",
					data: [
						{ phrase: "I" },
						{
							phrase: "can't have",
							translation: advrb.words.no,
							phraseTranslation: "NO can have",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "more" },
						{ phrase: "of" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 10,
					sentence: "My friend was from another state",
					translation: "My friend was DE another state",
					data: [
						{ phrase: "My" },
						{ phrase: "friend" },
						{ phrase: "was" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "another" },
						{ phrase: "state" },
					],
				},
				{
					id: 11,
					sentence: "We won't say you have that",
					translation: "We NO will say QUE you have ESO",
					data: [
						{ phrase: "We" },
						{
							phrase: "won't say",
							translation: [advrb.words.no],
							phraseTranslation: "NO will say",
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "you have",
							translation: conj.words.que,
							phraseTranslation: "QUE you have",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 12,
					sentence: "She doesn't have that",
					translation: "She NO has ESO",
					data: [
						{ phrase: "She" },
						{
							phrase: "doesn't have",
							translation: advrb.words.no,
							phraseTranslation: "NO has",
							reference: { "advrb.words.no": [7] },
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 13,
					sentence: "This doesn't tell us that is done",
					translation: "This NO tells us QUE ESO is done",
					data: [
						{ phrase: "This" },
						{
							phrase: "doesn't tell",
							translation: advrb.words.no,
							phraseTranslation: "NO tells",
							reference: { "advrb.words.no": [7] },
						},
						{
							phrase: "us that",
							translation: [conj.words.que, pron.demonstrative.words.eso],
							phraseTranslation: "us QUE ESO",
							reference: { "conj.words.que": [1] },
						},

						{ phrase: "is" },
						{ phrase: "done" },
					],
				},
				{
					id: 14,
					sentence: "Give my brother more of that",
					translation: "Give my brother more DE ESO",
					data: [
						{ phrase: "Give" },
						{ phrase: "my" },
						{ phrase: "brother" },
						{ phrase: "more" },
						{ phrase: "of", translation: prep.words.de },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 15,
					sentence: "It came down from the mountain",
					translation: "It came down DE the mountain",
					data: [
						{ phrase: "It" },
						{ phrase: "came" },
						{ phrase: "down" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "the" },
						{ phrase: "mountain" },
					],
				},
				{
					id: 16,
					sentence: "I'm tired of waiting around like this",
					translation: "I'm tired DE waiting around like this",
					data: [
						{ phrase: "I'm tired" },
						{ phrase: "of", translation: prep.words.de },
						{ phrase: "waiting around like this" },
					],
				},
				{
					id: 17,
					sentence: "The girl went to another country",
					translation: "The girl went A another country",
					data: [
						{ phrase: "The girl went" },
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "another" },
						{ phrase: "country" },
					],
				},
				{
					id: 18,
					sentence: "I want to give that to my brother",
					translation: "I want to give ESO A my brother",
					data: [
						{ phrase: "I" },
						{ phrase: "want" },
						{ phrase: "to" },
						{ phrase: "give" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "my" },
						{ phrase: "brother" },
					],
				},
				{
					id: 19,
					sentence: "Mark goes from New York to Houston",
					translation: "Mark goes DE New York A Houston",
					data: [
						{ phrase: "Mark" },
						{ phrase: "goes" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "New" },
						{ phrase: "York" },
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "Houston" },
					],
				},
				{
					id: 20,
					sentence: "This isn't my house",
					translation: "This NO is my house",
					data: [
						{ phrase: "This" },
						{
							phrase: "isn't",
							translation: advrb.words.no,
							phraseTranslation: "NO is",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "my" },
						{ phrase: "house" },
					],
				},
				{
					id: 21,
					sentence: "She can't walk very fast",
					translation: "She NO can walk very fast",
					data: [
						{ phrase: "She" },
						{
							phrase: "can't",
							translation: advrb.words.no,
							phraseTranslation: "NO can",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "walk" },
						{ phrase: "very" },
						{ phrase: "fast" },
					],
				},
				{
					id: 22,
					sentence: "They don't see why",
					translation: "They NO see why",
					data: [
						{ phrase: "They" },
						{
							phrase: "don't see",
							translation: advrb.words.no,
							phraseTranslation: "NO see",
							reference: { "advrb.words.no": [7] },
						},
						{ phrase: "why" },
					],
				},
				{
					id: 23,

					sentence: "That won't matter",
					translation: "ESO NO will matter",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{
							phrase: "won't mattter",
							translation: advrb.words.no,
							phraseTranslation: "NO will matter",
							reference: { "advrb.words.no": [6] },
						},
					],
				},
				{
					id: 24,
					sentence: "This doesn't tell us much",
					translation: "This NO tells us much",
					data: [
						{ phrase: "This" },
						{
							phrase: "doesn't tell",
							translation: advrb.words.no,
							phraseTranslation: "NO tells",
							reference: ref("noDoContractions"),
						},
						{ phrase: "us" },
						{ phrase: "much" },
					],
				},
				{
					id: 25,
					sentence: "He didn't know",
					translation: "He NO knew",
					data: [
						{ phrase: "He" },
						{
							phrase: "didn't know",
							translation: advrb.words.no,
							phraseTranslation: "NO knew",
							reference: { "advrb.words.no": [7] },
						},
					],
				},
			],
		},
		{
			lesson: 5,
			name: "Lesson 5",
			details: "Three common uses of DE!",
			info: [
				"From or Of only covers about half of the uses of DE! Because prepositions are notorious for use in quirky context. There are THREE main uses of DE as OF:",
				prep.words.de.info[1],
				prep.words.de.info[2],
				prep.words.de.info[3],
				prep.words.de.info[4],
			],
			wordBank: [],

			sentences: [
				{
					id: 1,
					sentence: "It's Samuel's water bottle!",
					translation: "It's the bottle DE water DE Samuel",
					data: [
						{ phrase: "It's" },
						{
							phrase: "Samuel's water bottle",
							phraseTranslation: "the bottle DE water DE Samuel",
							translation: [prep.words.de],
							reference: { "prep.words.de": [2, 4] },
						},
					],
				},
				{
					id: 2,
					sentence: "You won't tell me they did it?",
					translation: "You NO will tell QUE they did it?",
					data: [
						{ phrase: "You" },
						{
							phrase: "won't tell",
							translation: advrb.words.no,
							phraseTranslation: "NO will tell",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "me" },
						{
							phrase: "they did it?",
							phraseTranslation: "QUE they did it",
							translation: conj.words.que,
							reference: { "conj.words.que": [1] },
						},
					],
				},
				{
					id: 3,

					sentence: "Don't touch John's wine glass",
					translation: "NO touch the glass DE wine DE John",
					data: [
						{
							phrase: "Don't touch",
							translation: advrb.words.no,
							phraseTranslation: "NO touch",
							reference: { "advrb.words.no": [7] },
						},
						{
							phrase: "John's wine glass",
							phraseTranslation: "the glass DE wine DE John",
							translation: prep.words.de,
							reference: { "prep.words.de": [2, 4] },
						},
					],
				},
				{
					id: 4,
					sentence: "They took it to the lady from Italy",
					translation: "They took it A the lady DE Italy",
					data: [
						{ phrase: "They took it" },
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "the lady" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Italy" },
					],
				},
				{
					id: 5,
					sentence: "This can't be from from Spain!",
					translation: "This NO can be DE Spain!",
					data: [
						{ phrase: "This" },
						{
							phrase: "can't be",
							translation: advrb.words.no,
							phraseTranslation: "NO can be",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Spain!" },
					],
				},
				{
					id: 6,
					sentence: "I saw that it was a ceramic mug",
					translation: "I saw QUE it was a mug DE ceramic",
					data: [
						{ phrase: "I" },
						{ phrase: "saw" },
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{ phrase: "it was" },
						{ phrase: "a" },
						{
							phrase: "ceramic mug",
							phraseTranslation: "mug DE ceramic",
							translation: prep.words.de,
							reference: { "prep.words.de": [4] },
						},
					],
				},
				{
					id: 7,
					sentence: "You hoped she and I were together",
					translation: "You hoped QUE she Y I were together",
					data: [
						{
							phrase: "You hoped",
							phraseTranslation: "You hoped QUE",
							translation: conj.words.que,
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "she" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "I" },
						{ phrase: "were" },
						{ phrase: "together" },
					],
				},
				{
					id: 8,
					sentence: "I said that it isn't here",
					translation: "I said QUE it NO is here",
					data: [
						{ phrase: "I" },
						{ phrase: "said" },
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{ phrase: "it" },
						{
							phrase: "isn't here",
							phraseTranslation: "NO is here",
							translation: advrb.words.no,
							reference: { "advrb.words.no": [6] },
						},
					],
				},
				{
					id: 9,
					sentence: "She hoped we woudn't go to Canada",
					translation: "She hoped QUE we NO would go A Canada",
					data: [
						{
							phrase: "She hoped",
							translation: conj.words.que,
							phraseTranslation: "She hoped QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "we" },
						{
							phrase: "woudn't go",
							phraseTranslation: "NO would go",
							translation: advrb.words.no,
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "Canada" },
					],
				},
				{
					id: 10,
					sentence: "I couldn't believe that!",
					translation: "I NO could believe ESO!",
					data: [
						{ phrase: "I" },
						{
							phrase: "couldn't believe",
							translation: advrb.words.no,
							phraseTranslation: "NO could believe",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "that!", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 11,
					sentence: "It was Maria's plastic chair",
					translation: "It was the chair DE plastic DE Maria",
					data: [
						{ phrase: "It" },
						{ phrase: "was" },
						{
							phrase: "Maria's plastic chair",
							phraseTranslation: "the chair DE plastic DE Maria",
							translation: prep.words.de,
							reference: { "prep.words.de": [4, 2] },
						},
					],
				},
				{
					id: 12,
					sentence: "I think he ran from the house",
					translation: "I think QUE he ran DE the house",
					data: [
						{
							phrase: "I think",
							translation: conj.words.que,
							phraseTranslation: "I think QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "he ran" },

						{ phrase: "from", translation: prep.words.de },
						{ phrase: "the house" },
					],
				},
				{
					id: 13,
					sentence: "That doesn't matter.",
					translation: "ESO NO matters.",
					data: [
						{ phrase: "That" },
						{
							phrase: "doesn't matter.",
							phraseTranslation: "NO matters.",
							translation: advrb.words.no,
							reference: { "advrb.words.no": [7] },
						},
					],
				},
				{
					id: 14,
					sentence: "That came from this window",
					translation: "ESO came DE this window",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{ phrase: "came" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "this window" },
					],
				},
				{
					id: 15,
					sentence: "She didn't care and I knew it",
					translation: "She NO cared Y I knew it",
					data: [
						{
							phrase: "She didn't care",
							phraseTranslation: "She NO cared",
							translation: advrb.words.no,
							reference: { "advrb.words.no": [7] },
						},
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "I knew it" },
					],
				},
				{
					id: 16,
					sentence: "The birds of Africa",
					translation: "The birds DE Africa",
					data: [
						{ phrase: "The" },
						{ phrase: "birds" },
						{ phrase: "of", translation: prep.words.de },
						{ phrase: "Africa" },
					],
				},
				{
					id: 17,
					sentence: "The special wine from the cellar",
					translation: "The special wine DE the cellar",
					data: [
						{ phrase: "The" },
						{ phrase: "special" },
						{ phrase: "wine" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "the cellar" },
					],
				},
				{
					id: 18,
					sentence: "My friend from Toronto",
					translation: "My friend DE Toronto",
					data: [
						{ phrase: "My friend" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Toronto" },
					],
				},
				{
					id: 19,
					sentence: "The largest cities of Columbia",
					translation: "The largest cities DE Columbia",
					data: [
						{ phrase: "The" },
						{ phrase: "largest" },
						{ phrase: "cities" },
						{ phrase: "of", translation: prep.words.de },
						{ phrase: "Columbia" },
					],
				},
				{
					id: 20,
					sentence: "The pilot's schedule",
					translation: "The schedule DE the pilot",
					data: [
						{ phrase: "The" },
						{
							phrase: "pilot's schedule",
							translation: prep.words.de,
							phraseTranslation: "schedule DE the pilot",
						},
					],
				},
				{
					id: 21,
					sentence: "The rich smell of the food",
					translation: "The rich smell DE the food",
					data: [
						{ phrase: "The rich smell" },
						{ phrase: "of", translation: prep.words.de },
						{ phrase: "the food" },
					],
				},
				{
					id: 22,
					sentence: "Your brother's foot",
					translation: "The foot DE your brother",
					data: [
						{
							phrase: "Your brother's foot",
							translation: prep.words.de,
							phraseTranslation: "The foot DE your brother",
							reference: { "prep.words.de": [3] },
						},
					],
				},
				{
					id: 23,
					sentence: "The doctor's sister's nose",
					translation: "The nose DE the sister DE the doctor",
					data: [
						{
							phrase: "The doctor's sister's nose",
							translation: prep.words.de,
							phraseTranslation: "The nose DE the sister DE the doctor",
							reference: { "prep.words.de": [2, 3] },
						},
					],
				},
				{
					id: 24,
					sentence: "I said I was from Arizona",
					translation: "I said QUE I was DE Arizona",
					data: [
						{
							phrase: "I said",
							translation: conj.words.que,
							phraseTranslation: "I said QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "I" },
						{ phrase: "was" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Arizona" },
					],
				},
				{
					id: 25,
					sentence: "I hope Mom's leather jacket wasn't lost",
					translation: "I hope QUE the jacket DE leather DE Mom NO was lost",
					data: [
						{
							phrase: "I hope",
							translation: conj.words.que,
							phraseTranslation: "I hope QUE",
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "Mom's leather jacket",
							translation: prep.words.de,
							phraseTranslation: "the jacket DE leather DE Mom",
							reference: { "prep.words.de": [4, 2] },
						},
						{
							phrase: "wasn't lost",
							translation: advrb.words.no,
							phraseTranslation: "NO was lost",
							reference: { "advrb.words.no": [6] },
						},
					],
				},
				{
					id: 26,
					sentence: "I said it isn't here",
					translation: "I said QUE it NO is here",
					data: [
						{
							phrase: "I said",
							translation: conj.words.que,
							phraseTranslation: "I said QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "it" },
						{
							phrase: "isn't here",
							translation: advrb.words.no,
							phraseTranslation: "NO is here",
							reference: { "advrb.words.no": [6] },
						},
					],
				},
			],
		},
		{
			lesson: 6,
			name: "Lesson 6",
			details: "THE! First Articles and Gender",
			info: [
				"Spanish has several words to mean THE, most common is EL for MASC, and LA for FEM",
				noun.info[2],
			],
			wordBank: [artcl.words.el, artcl.words.la],
			sentences: [
				{
					id: 1,
					sentence: "The man has that",
					translation: "EL man has ESO",
					data: [
						{ phrase: "The", translation: artcl.words.el },
						{ phrase: "man" },
						{ phrase: "has" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 2,
					sentence: "The guy went to the house",
					translation: "EL guy went A the house",
					data: [
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "guy" },
						{ phrase: "went" },
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "the" },
						{ phrase: "house" },
					],
				},
				{
					id: 3,
					sentence: "That is the girl's",
					translation: "ESO is DE LA girl",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{ phrase: "is" },
						{
							phrase: "the girl's",
							translation: [prep.words.de, artcl.words.la],
							phraseTranslation: "DE LA girl",
							reference: { "prep.words.de": [2] },
						},
					],
				},
				{
					id: 4,
					sentence: "You couldn't come from there",
					translation: "YOU NO could come DE there",
					data: [
						{ phrase: "you" },
						{
							phrase: "couldn't come",
							translation: advrb.words.no,
							phraseTranslation: "NO could come",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "there" },
					],
				},
				{
					id: 5,
					sentence: "The boy didn't see us.",
					translation: "EL boy NO saw us",
					data: [
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "boy" },
						{
							phrase: "didn't see",
							translation: advrb.words.no,
							phraseTranslation: "NO saw",
							reference: { "advrb.words.no": [7] },
						},
						{ phrase: "us" },
					],
				},
				{
					id: 6,
					sentence: "The man can't have the girl's things",
					translation: "EL man NO can have the things DE LA girl",
					data: [
						{ phrase: "The", translation: artcl.words.el },
						{ phrase: "man" },
						{
							phrase: "can't have",
							translation: advrb.words.no,
							phraseTranslation: "NO can have",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "the" },
						{
							phrase: "girl's things",
							translation: [prep.words.de, artcl.words.la],
							phraseTranslation: "things DE LA girl",
							reference: { "prep.words.de": [2] },
						},
					],
				},
				{
					id: 7,
					sentence: "The man and the woman wouldn't go there",
					translation: "EL man Y LA woman NO would go there",
					data: [
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "man" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "woman" },
						{
							phrase: "wouldn't go",
							translation: advrb.words.no,
							phraseTranslation: "NO would go",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "there" },
					],
				},
				{
					id: 8,
					sentence: "The guy told the girl it was a plastic cup",
					translation: "EL guy told LA girl QUE it was a cup DE plastic",
					data: [
						{ phrase: "The", translation: artcl.words.el },
						{ phrase: "guy" },
						{ phrase: "told" },
						{
							phrase: "the girl",
							translation: conj.words.que,
							phraseTranslation: "LA girl QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "it" },
						{ phrase: "was" },
						{ phrase: "a" },
						{
							phrase: "plastic cup",
							translation: prep.words.de,
							phraseTranslation: "cup DE plastic",
							reference: { "prep.words.de": [4] },
						},
					],
				},
				{
					id: 9,
					sentence: "The lady and I told her it was OK",
					translation: "LA lady Y I told her QUE it was OK",
					data: [
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "lady" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "I" },
						{ phrase: "told" },
						{ phrase: "her" },
						{
							phrase: "it was OK",
							translation: conj.words.que,
							phraseTranslation: "QUE it was OK",
							reference: { "conj.words.que": [1] },
						},
					],
				},
				{
					id: 10,
					sentence: "The girl won't say that I did it",
					translation: "LA girl NO will say QUE I did it",
					data: [
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "girl" },
						{
							phrase: "won't say",
							translation: advrb.words.no,
							phraseTranslation: "NO will say",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "I" },
						{ phrase: "did" },
						{ phrase: "it" },
					],
				},
			],
		},
		{
			lesson: 7,
			name: "Lesson 7",
			details: "Direct Objects: LO, LA. ",
			info: [
				"How does HIM/HER fit in as far as Word Categories go, like nouns and verbs? It can't always be subsituted in place of other nouns: 'Food makes me happy.' != 'Him makes me happy' ",
				"HE and HIM have to go in very different and specific places in sentences, one is the subject (HE), and one is the Direct Object (HIM) ",
				pron.dObj.info[0],
				pron.dObj.info[1],
				pron.dObj.info[2],
				"The Spanish Direct Objects for HIM and HER are LO and LA!",
				"This LA(her) is diffrent then the LA for THE! If LA occurs before a noun it has to mean THE, if it occurs before a verb it has to mean HER!",
				pron.dObj.info[3],
			],
			wordBank: [
				pron.dObj.words.lo,
				pron.dObj.words.la,
				artcl.words.el,
				artcl.words.la,
			],
			sentences: [
				{
					id: 1,
					sentence: "Our friends see her",
					translation: "Our friends LA see",
					data: [
						{ phrase: "Our" },
						{ phrase: "friends" },
						{
							phrase: "see her",
							translation: pron.dObj.words.la,
							phraseTranslation: "LA see",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 2,
					sentence: "We found it",
					translation: "We LO found",
					data: [
						{ phrase: "We" },
						{
							phrase: "found it",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO found",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 3,
					sentence: "He loves it and calls it his own",
					translation: "He LO loves Y LO calls his own",
					data: [
						{ phrase: "He" },
						{
							phrase: "loves it",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO loves",
							reference: ref("dObjPosition"),
						},
						{ phrase: "and", translation: conj.words.y },
						{
							phrase: "calls it",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO calls",
							reference: ref("dObjPosition"),
						},
						{ phrase: "his own" },
					],
				},
				{
					id: 4,
					sentence: "She and I did it",
					translation: "She Y I LO did",
					data: [
						{ phrase: "She" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "I" },
						{
							phrase: "did it",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO did",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 5,
					sentence: "That caused it",
					translation: "ESO LO caused",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{
							phrase: "caused it",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO caused",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 6,
					sentence: "The girl doesn't love him",
					translation: "LA girl NO LO loves",
					data: [
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "girl" },
						{
							phrase: "doesn't love him",
							translation: [advrb.words.no, pron.dObj.words.lo],
							phraseTranslation: "NO LO loves",
							reference: ref("noDoContractions", "dObjPosition"),
						},
					],
				},
				{
					id: 7,
					sentence: "That went to it's home",
					translation: "ESO went A its home",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{ phrase: "went" },
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "its" },
						{ phrase: "home" },
					],
				},
				{
					id: 8,
					sentence: "I don't take her to school",
					translation: "I NO LA take A school",
					data: [
						{ phrase: "I" },
						{
							phrase: "don't take her",
							translation: [advrb.words.no, pron.dObj.words.la],
							phraseTranslation: "NO LA take",
							reference: ref("noDoContractions", "dObjPosition"),
						},
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "school" },
					],
				},
				{
					id: 9,
					sentence: "That didn't hurt her",
					translation: "ESO NO LA hurt",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{
							phrase: "didn't hurt her",
							translation: [advrb.words.no, pron.dObj.words.la],
							phraseTranslation: "NO LA hurt",
							reference: ref("noDoContractions", "dObjPosition"),
						},
					],
				},
				{
					id: 10,
					sentence: "The man found her with a rag doll",
					translation: "EL man LA found with a doll DE rag",
					data: [
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "man" },
						{
							phrase: "found her",
							translation: pron.dObj.words.la,
							phraseTranslation: "LA found",
							reference: ref("dObjPosition"),
						},
						{ phrase: "with" },
						{ phrase: "a" },
						{
							phrase: "rag doll",
							translation: prep.words.de,
							phraseTranslation: "doll DE rag",
							reference: { "prep.words.de": [4] },
						},
					],
				},
				{
					id: 11,
					sentence: "The boy is not the same one",
					translation: "EL boy NO is EL same one",
					data: [
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "boy" },
						{
							phrase: "is not",
							translation: [advrb.words.no, pron.dObj.words.lo],
							phraseTranslation: "NO is",
							reference: { "advrb.words.no": [6] },
						},
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "same" },
						{ phrase: "one" },
					],
				},
				{
					id: 12,
					sentence: "I think the girl saw him",
					translation: "I think QUE LA girl LO saw",
					data: [
						{
							phrase: "I think",
							translation: conj.words.que,
							phraseTranslation: "I think QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "girl" },
						{
							phrase: "saw him",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO saw",
						},
					],
				},
				{
					id: 13,
					sentence: "My dog saw her coming from the store",
					translation: "My dog LA saw coming DE the store",
					data: [
						{ phrase: "My" },
						{ phrase: "dog" },
						{
							phrase: "saw her",
							translation: pron.dObj.words.la,
							phraseTranslation: "LA saw",
						},
						{ phrase: "coming" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "the" },
						{ phrase: "store" },
					],
				},
				{
					id: 14,
					sentence: "I think that is from Canada",
					translation: "I think QUE ESO is DE Canada",
					data: [
						{
							phrase: "I think",
							translation: conj.words.que,
							phraseTranslation: "I think QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "is" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Canada" },
					],
				},
				{
					id: 15,
					sentence: "The girl from your country did that",
					translation: "LA girl DE your country did ESO",
					data: [
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "girl" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "your" },
						{ phrase: "country" },
						{ phrase: "did" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 16,
					sentence: "The man and the woman see her",
					translation: "EL man Y LA woman LA see",
					data: [
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "man" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "woman" },
						{
							phrase: "see her",
							translation: pron.dObj.words.la,
							phraseTranslation: "LA see",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 17,
					sentence: "The mother didn't find him",
					translation: "LA mother NO LO found",
					data: [
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "mother" },
						{
							phrase: "didn't find him",
							translation: [advrb.words.no, pron.dObj.words.lo],
							phraseTranslation: "NO LO found",
							reference: { "advrb.words.no": [7] },
						},
					],
				},
				{
					id: 18,
					sentence: "Sara's music drifted to his ears",
					translation: "The music DE Sara drifted A his ears",
					data: [
						{
							phrase: "Sara's music",
							translation: prep.words.de,
							phraseTranslation: "The music DE Sara",
							reference: { "prep.words.de": [2] },
						},
						{ phrase: "drifted" },
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "his ears" },
					],
				},
				{
					id: 19,
					sentence: "She and I chased a bird and it flew away from us",
					translation: "She Y I chased a bird Y it flew away DE us",
					data: [
						{ phrase: "She" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "I" },
						{ phrase: "chased a bird" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "it flew away" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "us" },
					],
				},
				{
					id: 20,
					sentence: "They said he told them he had gone to the party",
					translation: "They said QUE he told them QUE he had gone A the party",
					data: [
						{
							phrase: "They said",
							translation: conj.words.que,
							phraseTranslation: "They said QUE",
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "he told them",
						},
						{
							phrase: "that he had gone",
							translation: conj.words.que,
							phraseTranslation: "he told them QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "the party" },
					],
				},
			],
		},
		{
			lesson: 8,
			name: "Lesson 8",
			details: "Direct Obj Pronouns: TE, and ME. and Artcls: UN and UNA",
			info: [
				"We leared about Direct Object Pronoun Placement, He saw her = He HER saw or He LA saw, but what about ESO, He saw ESO, isn't ESO functioning as a Direct Object here?",
				"The only Direct Objects that get shuffled in the sentence are the Direct Object PRONOUNS, so far we've learned of LA (her) and LO (him) both can mean IT (M/F)",
				"TE, and ME, are the Spanish Direct Object Pronouns for YOU and ME!",
				"Although ESO is a Pronoun, and in 'She saw ESO' it is functioning as a Direct Object it still isn't one of the specific Direct Object Pronouns! SO it doesn't get shuffled.",
			],
			wordBank: [
				pron.dObj.words.te,
				pron.dObj.words.me,
				artcl.words.un,
				artcl.words.una,
			],
			sentences: [
				{
					id: 1,
					sentence: "They found me",
					translation: "They ME found",
					data: [
						{ phrase: "They" },
						{
							phrase: "found me",
							translation: pron.dObj.words.me,
							phraseTranslation: "ME found",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 2,
					sentence: "We saw you",
					translation: "We TE saw",
					data: [
						{ phrase: "We" },
						{
							phrase: "saw you",
							translation: pron.dObj.words.te,
							phraseTranslation: "TE saw",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 3,
					sentence: "The woman has a daughter",
					translation: "LA woman has UNA daughter",
					data: [
						{ phrase: "The", translation: artcl.words.la },
						{ phrase: "woman" },
						{ phrase: "has" },
						{ phrase: "a", translation: artcl.words.una },
						{ phrase: "daughter" },
					],
				},
				{
					id: 4,
					sentence: "The girl found me",
					translation: "LA girl ME found",
					data: [
						{ phrase: "The", translation: artcl.words.la },
						{ phrase: "girl" },
						{
							phrase: "found me",
							translation: pron.dObj.words.me,
							phraseTranslation: "ME found",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 5,
					sentence: "It was a girl from Argentina",
					translation: "It was UNA girl DE Argentina.",
					data: [
						{ phrase: "It" },
						{ phrase: "was" },
						{ phrase: "a", translation: artcl.words.una },
						{ phrase: "girl" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Argentina" },
					],
				},
				{
					id: 6,
					sentence: "We know he saw you.",
					translation: "We know QUE he TE saw.",
					data: [
						{
							phrase: "We know",
							translation: conj.words.que,
							phraseTranslation: "We know QUE",
							reference: { "conj.words.que": [1] },
						},

						{
							phrase: "he saw you",
							translation: pron.dObj.words.te,
							phraseTranslation: "he TE saw.",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 7,
					sentence: "They said that it wasn't a plastic dish",
					translation: "They said QUE it NO was a dish DE plastic",
					data: [
						{
							phrase: "They said",
						},
						{
							phrase: "that",
							translation: conj.words.que,
							phraseTranslation: "They said QUE",
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "it wasn't",
							phraseTranslation: "it NO was",
							translation: advrb.words.no,
							reference: ref("noContractions"),
						},
						{ phrase: "a" },
						{
							phrase: "plastic dish",
							translation: prep.words.de,
							phraseTranslation: "dish DE plastic",
							reference: { "prep.words.de": [4] },
						},
					],
				},
				{
					id: 8,
					sentence: "A girl and her dog found you",
					translation: "UNA girl Y her dog TE found",
					data: [
						{ phrase: "A", translation: artcl.words.una },
						{ phrase: "girl" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "her" },
						{ phrase: "dog" },
						{
							phrase: "found you",
							translation: pron.dObj.words.te,
							phraseTranslation: "TE found",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 9,
					sentence: "A man says he knows me",
					translation: "UN man says QUE he knows ME",
					data: [
						{ phrase: "A", translation: artcl.words.un },
						{
							phrase: "man says",
							translation: conj.words.que,
							phraseTranslation: "man says QUE",
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "he knows me",
							translation: pron.dObj.words.me,
							phraseTranslation: "he ME knows",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 10,
					sentence: "He said that he moved from Peru to California",
					translation: "He said QUE he moved DE Peru A California",
					data: [
						{
							phrase: "He said",
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "he moved" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Peru" },
						{ phrase: "to", translation: prep.words.a },
						{ phrase: "California" },
					],
				},
				{
					id: 11,
					sentence: "John's father found her",
					translation: "EL father DE John LA found",
					data: [
						{
							phrase: "John's father",
							translation: [prep.words.de, artcl.words.el],
							phraseTranslation: "EL father DE John",
							reference: ref("dePossession"),
						},
						{
							phrase: "found her",
							translation: pron.dObj.words.la,
							phraseTranslation: "LA found",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 12,
					sentence: "A man did that and I found him",
					translation: "UN man did ESO Y I LO found",
					data: [
						{ phrase: "A", translation: artcl.words.un },
						{ phrase: "man" },
						{ phrase: "did" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "and", translation: conj.words.y },
						{
							phrase: "I found him",
							translation: pron.dObj.words.lo,
							phraseTranslation: "I LO found",
							reference: ref("dObjPosition"),
						},
					],
				},
			],
		},
		{
			lesson: 9,
			name: "Lesson 9",
			details: "Prepositions: POR and PARA, CON and EN!",
			info: [
				`Remember: ${prep.info[0]}`,
				"Two new Prepositions are: CON meaning WITH, and EN meanin AT, ON, or IN, but mostly at! 'I'm AT/EN the Table'",
				`The nuance with EN, is ${prep.info[0]}`,
				`TIME! ${prep.words.a.info[0]}`,
				`Two new tricky Prepsotions are POR and PARA, they are nuanced because: ${prep.info[1]}`,
				prep.words.para.info[0],
				prep.words.para.info[1],
				`POR is far less straightforward. ${prep.words.para.info[0]}`,
				prep.words.para.info[1],
				prep.words.para.info[2],
				prep.words.para.info[3],
				prep.words.para.info[4],
				prep.words.para.info[5],
				prep.words.para.info[6],
				prep.words.para.info[7],
				"Something funny happens with these two Prepositions and Time: Do something PARA this Evening, or Do something POR this Evening",
				prep.words.para.info[8],
				prep.words.para.info[2],
				"Another interesting thing happens using ESO: POR ESO or PARA ESO:",
				prep.words.para.info[9],
				"These combinations are known as IDIOMS, which are phrases that don't usually translate properly to english but are commonly used by native speakers",
			],
			wordBank: [prep.words.con, prep.words.en, prep.words.para],
			sentences: [
				{
					id: 1,
					sentence: "They were in the room at 4:00",
					translation: "They were EN the room A 4:00",
					data: [
						{ phrase: "They were" },
						{ phrase: "in", translation: prep.words.en },
						{ phrase: "the" },
						{ phrase: "room" },
						{
							phrase: "at",
							translation: prep.words.a,
							reference: { "prep.words.a": [0] },
						},
						{ phrase: "4:00" },
					],
				},
				{
					id: 2,
					sentence: "I was at a party with the girls",
					translation: "I was EN a party CON the girls",
					data: [
						{ phrase: "I was" },
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "a" },
						{ phrase: "party" },
						{ phrase: "with", translation: prep.words.con },
						{ phrase: "the" },
						{ phrase: "girls" },
					],
				},
				{
					id: 3,
					sentence: "We ate with our friends at 6:00",
					translation: "We ate CON our friends A 6:00",
					data: [
						{ phrase: "We" },
						{ phrase: "ate" },
						{ phrase: "with", translation: prep.words.con },
						{ phrase: "our" },
						{ phrase: "friends" },
						{
							phrase: "at",
							translation: prep.words.a,
							reference: { "prep.words.a": [0] },
						},
						{ phrase: "6:00" },
					],
				},
				{
					id: 4,
					sentence: "The book was written by a young girl",
					translation: "The book was written POR UNA young girl",
					data: [
						{ phrase: "The book was written" },
						{
							phrase: "by",
							translation: prep.words.por,
							reference: ref("porCauseBy"),
						},
						{ phrase: "a", translation: artcl.words.una },
						{ phrase: "young" },
						{ phrase: "girl" },
					],
				},
				{
					id: 5,
					sentence: "That was because of those problems",
					translation: "ESO was POR those problems",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{ phrase: "was" },
						{
							phrase: "beacuase of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{ phrase: "those problems" },
					],
				},
				{
					id: 6,
					sentence: "We ran along the street",
					translation: "We ran POR the street",
					data: [
						{ phrase: "We ran" },
						{
							phrase: "along",
							translation: prep.words.por,
							reference: ref("porAlong"),
						},
						{ phrase: "the" },
						{ phrase: "street" },
					],
				},
				{
					id: 7,
					sentence: "I saw him during the morning",
					translation: "I LO saw POR the morning",
					data: [
						{
							phrase: "I saw him",
							translation: pron.dObj.words.lo,
							phraseTranslation: "I LO saw",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "during",
							translation: prep.words.por,
							reference: { "prep.words.por": [8] },
						},
						{ phrase: "the" },
						{ phrase: "morning" },
					],
				},
				{
					id: 8,
					sentence: "The boss(F) wants that by lunch",
					translation: "LA boss wants eso PARA lunch",
					data: [
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "boss(F)" },
						{ phrase: "wants" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{
							phrase: "by",
							translation: prep.words.para,
							reference: { "prep.words.para": [2] },
						},
						{ phrase: "lunch" },
					],
				},
				{
					id: 9,
					sentence: "I don't babysit the girl during the evenings",
					translation: "I NO babysit LA girl POR the evenings",
					data: [
						{
							phrase: "I don't babysit",
							translation: advrb.words.no,
							phraseTranslation: "I NO babysit",
							reference: { "advrb.words.no": [7] },
						},
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "girl" },
						{
							phrase: "during",
							translation: prep.words.por,
							reference: ref("porDuring"),
						},
						{ phrase: "the" },
						{ phrase: "evenings" },
					],
				},
				{
					id: 10,
					sentence: "I went to the store during the afternoon	",
					translation: "I went A the store POR the afternoon",
					data: [
						{ phrase: "I went" },
						{
							phrase: "to",
							translation: prep.words.a,
							reference: { "prep.words.a": [0] },
						},
						{ phrase: "the store" },
						{
							phrase: "during",
							translation: prep.words.por,
							reference: ref("porDuring"),
						},
						{ phrase: "the" },
						{ phrase: "afternoon" },
					],
				},
				{
					id: 11,
					sentence: "The actress is on the stage",
					translation: "LA actress is EN the stage",
					data: [
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "actress" },
						{ phrase: "is" },
						{ phrase: "on", translation: prep.words.en },
						{ phrase: "the" },
						{ phrase: "stage" },
					],
				},
				{
					id: 12,
					sentence: "I said he was around here",
					translation: "I said QUE he was AROUND here",
					data: [
						{
							phrase: "I said",
							translation: conj.words.que,
							phraseTranslation: "I said QUE",
							reference: { "conj.words.que": [1] },
						},
						{ phrase: "he" },
						{ phrase: "was" },
						{
							phrase: "around",
							translation: prep.words.por,
							reference: ref("porLocation"),
						},
						{ phrase: "here" },
					],
				},
				{
					id: 13,
					sentence: "That won't be for him",
					translation: "That NO will be PARA him",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{
							phrase: "won't be",
							translation: advrb.words.no,
							phraseTranslation: "NO will be",
							reference: ref("noContractions"),
						},
						{
							phrase: "for",
							translation: prep.words.para,
							reference: { "prep.words.para": [0] },
						},
						{ phrase: "him" },
					],
				},
				{
					id: 14,
					sentence: "She ran out of there because of the fire",
					translation: "She ran out DE there POR the fire",
					data: [
						{ phrase: "She ran" },
						{ phrase: "out" },
						{ phrase: "of", translation: prep.words.de },
						{ phrase: "there" },
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{ phrase: "the" },
						{ phrase: "fire" },
					],
				},
				{
					id: 15,
					sentence: "That was created by an interesting guy",
					translation: "ESO was created POR UN interesting guy",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{ phrase: "was" },
						{ phrase: "created" },
						{
							phrase: "by",
							translation: prep.words.por,
							reference: ref("porCauseBy"),
						},
						{ phrase: "an", translation: artcl.words.un },
						{ phrase: "interesting" },
						{ phrase: "guy" },
					],
				},
				{
					id: 16,
					sentence: "I saw her in the store with her mom",
					translation: "I LA saw EN the store CON her mom",
					data: [
						{
							phrase: "I saw her",
							translation: pron.dObj.words.la,
							phraseTranslation: "I LA saw",
							reference: ref("dObjPosition"),
						},
						{ phrase: "in", translation: prep.words.en },
						{ phrase: "the" },
						{ phrase: "store" },
						{ phrase: "with", translation: prep.words.con },
						{ phrase: "her" },
						{ phrase: "mom" },
					],
				},
				{
					id: 17,
					sentence: "I said that my fur coat is from Europe",
					translation: "I said QUE my coat DE fur is DE Europe",
					data: [
						{
							phrase: "I said",
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "my" },
						{
							phrase: "fur coat",
							translation: prep.words.de,
							phraseTranslation: "coat DE fur",
							reference: { "prep.words.de": [4] },
						},
						{ phrase: "is" },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Europe" },
					],
				},
				{
					id: 18,
					sentence: "Maria's son will be here by then	",
					translation: "EL son DE Maria will be here PARA then",
					data: [
						{
							phrase: "Maria's son",
							translation: [prep.words.de, artcl.words.el],
							phraseTranslation: "EL son DE Maria",
							reference: { "prep.words.de": [2] },
						},
						{ phrase: "will be here" },
						{
							phrase: "by",
							translation: prep.words.para,
							reference: { "prep.words.para": [2] },
						},
						{ phrase: "then" },
					],
				},
				{
					id: 19,
					sentence: "I have to leave at 2:00 and he can't",
					translation: "I have to leave A 2:00 Y he NO can",
					data: [
						{ phrase: "I" },
						{ phrase: "have" },
						{ phrase: "to" },
						{ phrase: "leave" },
						{
							phrase: "at",
							translation: prep.words.a,
							reference: ref("aAndTime"),
						},
						{ phrase: "2:00" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "he" },
						{
							phrase: "can't",
							translation: advrb.words.no,
							phraseTranslation: "NO can",
							reference: { "advrb.words.no": [6] },
						},
					],
				},
				{
					id: 20,
					sentence: "She's a girl that I know; that's why she knows you",
					translation: "She's UNA girl QUE I know, POR ESO she TE knows",
					data: [
						{ phrase: "She's" },
						{ phrase: "a", translation: artcl.words.una },
						{ phrase: "girl" },
						{
							phrase: "that I know",
							translation: conj.words.que,
							phraseTranslation: "QUE I know",
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "that's why",
							translation: [prep.words.por, pron.demonstrative.words.eso],
							phraseTranslation: "POR ESO",
							reference: ref("porEso"),
						},

						{
							phrase: "she knows you",
							translation: pron.dObj.words.te,
							phraseTranslation: "she TE knows",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 21,
					sentence: "He didn't bring me along this street	",
					translation: "He NO ME brought POR this street",
					data: [
						{ phrase: "He" },
						{
							phrase: "didn't bring me",
							translation: [advrb.words.no, pron.dObj.words.me],
							phraseTranslation: "NO ME brought",
							reference: ref("noDoContractions", "dObjPosition"),
						},
						{
							phrase: "along",
							translation: prep.words.por,
							reference: ref("porAlong"),
						},
						{ phrase: "this" },
						{ phrase: "street" },
					],
				},
			],
		},
		{
			lesson: 10,
			name: "Lesson 10",
			details: "Articles and Direct Obj Pronouns: LOS and LAS",
			info: [
				"LOS and LAS can be DIRECT OBJ PRONOUNS that mean THEM (M/F) in Spanish ",
				"LOS and LAS can also be ARTICLES that mean THE (pluralized) : The/LOS Men, The/LAS women",
				"'QUÉ' is another Pronoun meaning WHAT, usually used to turn sentences into questions",
			],
			wordBank: [
				artcl.words.los,
				artcl.words.las,
				pron.dObj.words.los,
				pron.dObj.words.las,
				pron.interrogative.words.que,
			],
			sentences: [
				{
					id: 1,
					sentence: "The girls visited them(M)",
					translation: "LAS girls LOS visited",
					data: [
						{ phrase: "The", translation: artcl.words.las },
						{ phrase: "girls" },
						{
							phrase: "visited them(M)",
							translation: pron.dObj.words.los,
							phraseTranslation: "LOS visited",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 2,
					sentence: "the boys know them(F)",
					translation: "LOS boys LAS know",
					data: [
						{ phrase: "the", translation: artcl.words.los },
						{ phrase: "boys" },
						{
							phrase: "know them(F)",
							translation: pron.dObj.words.las,
							phraseTranslation: "LAS know",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 3,
					sentence: "The man doesn't see them (F)",
					translation: "EL man NO LAS see",
					data: [
						{ phrase: "The", translation: artcl.words.el },
						{ phrase: "man" },
						{
							phrase: "doesn't see them(F)",
							translation: [advrb.words.no, pron.dObj.words.las],
							phraseTranslation: "NO LAS see",
							reference: ref("noDoContractions", "dObjPosition"),
						},
					],
				},
				{
					id: 4,
					sentence: "We won't have them(M) at the table	",
					translation: "We NO LOS will have EN the table",
					data: [
						{ phrase: "We" },
						{
							phrase: "won't have them(M)",
							translation: [advrb.words.no, pron.dObj.words.los],
							phraseTranslation: "NO LOS will have",
							reference: ref("noContractions", "dObjPosition"),
						},
						{
							phrase: "at",
							translation: prep.words.en,
						},
						{ phrase: "the" },
						{ phrase: "table" },
					],
				},
				{
					id: 5,
					sentence: "They worked with what?",
					translation: "They worked CON QUÉ?",
					data: [
						{ phrase: "They" },
						{ phrase: "worked" },
						{ phrase: "with", translation: prep.words.con },
						{
							phrase: "what?",
							translation: pron.interrogative.words.que,
						},
					],
				},
				{
					id: 6,
					sentence: "What hit him?",
					translation: "QUÉ lo hit?",
					data: [
						{
							phrase: "What",
							translation: pron.interrogative.words.que,
						},
						{
							phrase: "hit him",
							translation: pron.dObj.words.lo,
							phraseTranslation: "lo hit",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 7,
					sentence: "You found them(F) with what?",
					translation: "You LAS found CON QUE?",
					data: [
						{
							phrase: "You found them(F)",
							translation: pron.dObj.words.las,
							phraseTranslation: "You LAS found",
							reference: ref("dObjPosition"),
						},

						{ phrase: "with", translation: prep.words.con },
						{
							phrase: "what?",
							translation: pron.interrogative.words.que,
						},
					],
				},
				{
					id: 8,
					sentence: "What is that for?",
					translation: "PARA QUE is ESO",
					data: [
						{
							phrase: "What is that for",
							translation: [
								conj.words.que,
								prep.words.para,
								pron.demonstrative.words.eso,
							],
							phraseTranslation: "PARA QUE is ESO",
							reference: ref("paraQuePron", "prepPosition"),
						},
					],
				},
				{
					id: 9,
					sentence: "Why is the man at the store?",
					translation: "POR QUE is EL man EN the store",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							phraseTranslation: "POR QUE",
							reference: ref("porQueWhy"),
						},
						{ phrase: "is" },
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "man" },
						{
							phrase: "at",
							translation: prep.words.en,
						},
						{ phrase: "the" },
						{ phrase: "store" },
					],
				},
				{
					id: 10,
					sentence: "This is for the guys",
					translation: "This is PARA LOS guys",
					data: [
						{ phrase: "This" },
						{ phrase: "is" },
						{
							phrase: "for",
							translation: prep.words.para,
							reference: ref("paraFor"),
						},
						{ phrase: "the", translation: artcl.words.los },
						{ phrase: "guys" },
					],
				},
				{
					id: 11,
					sentence: "I didn't see a girl at 2:00",
					translation: "I NO saw una girl A 2:00",
					data: [
						{ phrase: "I" },
						{
							phrase: "didn't see",
							translation: advrb.words.no,
							phraseTranslation: "NO saw",
							reference: { "advrb.words.no": [7] },
						},
						{ phrase: "a", translation: artcl.words.una },
						{ phrase: "girl" },
						{
							phrase: "at",
							translation: prep.words.a,
							reference: { "prep.words.a": [0] },
						},
						{ phrase: "2:00" },
					],
				},
				{
					id: 12,
					sentence: "You need to be in the car at 2:00",
					translation: "You need to be EN the car A 2:00",
					data: [
						{ phrase: "You need to be" },
						{
							phrase: "in",
							translation: prep.words.en,
						},
						{ phrase: "the" },
						{ phrase: "car" },
						{
							phrase: "at",
							translation: prep.words.a,
							reference: { "prep.words.a": [0] },
						},
						{ phrase: "2:00" },
					],
				},
				{
					id: 13,
					sentence: "But why?",
					translation: "But POR QUE",
					data: [
						{ phrase: "But" },
						{
							phrase: "why?",
							translation: [prep.words.por, pron.interrogative.words.que],
							phraseTranslation: "POR QUE",
							reference: ref("porQueWhy"),
						},
					],
				},
				{
					id: 14,
					sentence: "I left something for my boss at the office	",
					translation: "I left something PARA my boss EN the office",
					data: [
						{ phrase: "I left" },
						{ phrase: "something" },
						{
							phrase: "for",
							translation: prep.words.para,
							reference: ref("paraFor"),
						},
						{ phrase: "my" },
						{ phrase: "boss" },
						{
							phrase: "at",
							translation: prep.words.en,
						},
						{ phrase: "the" },
						{ phrase: "office" },
					],
				},
				{
					id: 15,
					sentence: "This was created by the girls",
					translation: "This was created POR LAS girls",
					data: [
						{ phrase: "This was created" },
						{
							phrase: "by",
							translation: prep.words.por,
							reference: ref("porCauseBy"),
						},
						{ phrase: "the", translation: artcl.words.las },
						{ phrase: "girls" },
					],
				},
				{
					id: 16,
					sentence: "On what did he put it?",
					translation: "EN QUÉ he LO put",
					data: [
						{
							phrase: "On",
							translation: prep.words.en,
						},
						{
							phrase: "what",
							translation: pron.interrogative.words.que,
						},
						{
							phrase: "did he put it",
							translation: pron.dObj.words.lo,
							phraseTranslation: "he LO put",
							reference: ref("dObjPosition", "noDo"),
						},
					],
				},
				{
					id: 17,
					sentence: "The ladies saw her",
					translation: "LAS ladies LA saw",
					data: [
						{ phrase: "The", translation: artcl.words.las },
						{ phrase: "ladies" },
						{
							phrase: "saw her",
							translation: pron.dObj.words.la,
							phraseTranslation: "LA saw",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 18,
					sentence: "What isn't here yet?",
					translation: "QUÉ NO is here yet?",
					data: [
						{
							phrase: "What",
							translation: pron.interrogative.words.que,
						},
						{
							phrase: "isn't here",
							translation: advrb.words.no,
							phraseTranslation: "NO is here?",
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "yet?",
						},
					],
				},
				{
					id: 19,
					sentence: "I saw them(M) near the park",
					translation: "I LOS saw POR the park",
					data: [
						{ phrase: "I" },
						{
							phrase: "saw them(M)",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LOS saw",
						},
						{
							phrase: "near",
							translation: prep.words.por,
							reference: ref("porLocation"),
						},
						{ phrase: "the park" },
					],
				},
				{
					id: 20,
					sentence: "I found it(M) beacuse of the smell",
					translation: "I LO found POR the smell",
					data: [
						{ phrase: "I" },
						{
							phrase: "found it(M)",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO found",
						},
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{ phrase: "the" },
						{ phrase: "smell" },
					],
				},
				{
					id: 21,
					sentence: "I have loved you for many years",
					translation: "I TE have loved POR many years",
					data: [
						{ phrase: "I" },
						{
							phrase: "have loved you",
							translation: pron.dObj.words.te,
							phraseTranslation: "TE have loved",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "for",
							translation: prep.words.por,
							reference: ref("porFor"),
						},
						{ phrase: "many" },
						{ phrase: "years" },
					],
				},
				{
					id: 22,
					sentence: "A man confronted them(M)",
					translation: "UN man LOS confronted",
					data: [
						{ phrase: "A", translation: artcl.words.un },
						{ phrase: "man" },
						{
							phrase: "confronted them(M)",
							translation: pron.dObj.words.los,
							phraseTranslation: "LOS confronted",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 23,
					sentence: "What did you eat with it(F)?",
					translation: "CON QUE you LA ate",
					data: [
						{
							phrase: "(With) What",
							translation: [prep.words.con, pron.interrogative.words.que],
							phraseTranslation: "CON QUE",
						},
						{
							phrase: "did you eat with it",
							translation: pron.dObj.words.la,
							phraseTranslation: "you LA ate",
							reference: ref("dObjPosition", "noDo"),
						},
					],
				},
				{
					id: 24,
					sentence: "I left them(F) with their parents",
					translation: "I LAS left CON their parents",
					data: [
						{ phrase: "I" },
						{
							phrase: "left them",
							translation: pron.dObj.words.las,
							phraseTranslation: "LAS left",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "with",
							translation: prep.words.con,
						},
						{ phrase: "their parents" },
					],
				},
				{
					id: 25,
					sentence: "Don't bother the men with that",
					translation: "NO bother LOS men CON ESO",
					data: [
						{
							phrase: "Don't bother",
							translation: advrb.words.no,
							phraseTranslation: "NO bother",
							reference: { "advrb.words.no": [7] },
						},
						{
							phrase: "the men",
							translation: pron.dObj.words.los,
							phraseTranslation: "LOS men",
						},
						{
							phrase: "with",
							translation: prep.words.con,
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 26,
					sentence: "I'm on the list; that's why he knows me",
					translation: "I'm EN the list, POR ESO he ME knows	",
					data: [
						{ phrase: "I'm" },
						{
							phrase: "on",
							translation: prep.words.en,
						},
						{ phrase: "the list" },
						{
							phrase: "that's why",
							translation: [prep.words.por, pron.demonstrative.words.eso],
							phraseTranslation: "POR ESO",
							reference: ref("porEso"),
						},
						{
							phrase: "He knows me",
							translation: pron.dObj.words.me,
							phraseTranslation: "he ME knows",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 27,
					sentence: "I can't see them(F)",
					translation: "I NO LAS can see",
					data: [
						{ phrase: "I" },
						{
							phrase: "can't",
							translation: advrb.words.no,
							phraseTranslation: "NO can",
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "see them(F)",
							translation: pron.dObj.words.las,
							phraseTranslation: "LAS see",
						},
					],
				},
			],
		},
		{
			lesson: 11,
			name: "Lesson 11",
			details: "Expressing abstract ideas",
			wordBank: [],
			info: [
				"Learning to express abstract concepts is more constructive to Deep Language Learning than learning lots of vocab words.",
				"MOST of what we say in any language doesn't consist of simple concrete labels for things, instead we talk about intangible ideas almost constantly",
				"Consider the sentence: `I'd prefer that they do it by this afternoon`, seems simple in English, but to express this in another language requires some really deep knowledge of how the language works.",
				"That sentence is a sort of INTENTION, you are expressing that this IDEA of them doing it by this afernoon is SOMETHING that you want.",
				"This sentence type is commonly seen like: 'I predict that they'll....' or 'I like that they....'",
				"We will learn the words you use for preferring, or predicting, or liking something soon, but currently we want to know exactly HOW and WHERE those words get used in a sentence",
				"Let's play the FOOD game with the previous Sentence; 'I'd prefer that they do it by this afternoon'. \nThis can be turned into 'I'd prefer FOOD!",
				"This is the magic of turning rich, complex ideas into nouns! Imagine mastering the lanugage so well that you can take all you most unique thoughts, opinions, reactions, and interntions, and express them as easily as a simple word like FOOD!",
				"The whole KEY to doing this is the #1 word in Spanish... QUE!. \nThis word lets us take any abstract idea and package it as a NOUN PHRASE to use in a sentence.",
				"In sentences like 'I predict that...' the entire phrase that starts with that / QUE can be treated as the noun, we call this a 'QUE PHRASE!'",
				"A common idiom related to this idea is PARA QUE, meaning 'So that' or 'In order that'",
				"PARA being a Preposition, needs to be followed by a noun, and in this case it is since QUE is the start of the NOUN PHRASE. 'I brought him PARA (QUE he could meet her)'.",
				"Another QUE phrase includes the other qué meaning WHAT, like What Luck!. Qué luck! In English we use HOW for this. HOW strange that he's here = Qué stange QUE he's here!",
				"One last use for QUE the Conjunction (no accent) besides THAT is THAN, as in 'He is taller THAN his brother'.",
			],
			sentences: [
				{
					id: 1,
					sentence: "She did it so that I would notice her",
					translation: "She LO did PARA QUE I LA would notice",
					data: [
						{
							phrase: "She did it",
							translation: pron.dObj.words.lo,
							phraseTranslation: "She LO did",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "so that",
							translation: [prep.words.para, conj.words.que],
							phraseTranslation: "PARA QUE",
							reference: ref("paraQueConj"),
						},
						{
							phrase: "I would notice her",
							translation: [pron.dObj.words.la],
							phraseTranslation: "I LA would notice",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 2,
					sentence: "The girls are here so that you can take a break",
					translation: "LAS girls are here PARA QUE you can take a break",
					data: [
						{ phrase: "The", translation: artcl.words.las },
						{ phrase: "girls are here" },
						{
							phrase: "so that",
							translation: [prep.words.para, conj.words.que],
							phraseTranslation: "PARA QUE",
							reference: ref("paraQueConj"),
						},
						{
							phrase: "you can take a break",
						},
					],
				},
				{
					id: 3,
					sentence: "How scary that you almost crashed",
					translation: "QUÉ scary QUE you almost crashed",
					data: [
						{
							phrase: "How scary",
							translation: pron.interrogative.words.que,
							reference: { "pron.interrogative.words.que": [0] },
							phraseTranslation: "Qué scary",
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "you almost crashed",
						},
					],
				},
				{
					id: 4,
					sentence: "How cool that he's with her",
					translation: "QUÉ cool QUE he's with her",
					data: [
						{
							phrase: "How cool",
							translation: pron.interrogative.words.que,
							reference: { "pron.interrogative.words.que": [0] },
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "he's",
						},
						{
							phrase: "with",
							translation: prep.words.con,
						},
						{
							phrase: "her",
						},
					],
				},
				{
					id: 5,
					sentence: "How sad that the girl didn't win",
					translation: "QUÉ sad QUE LA girl no won",
					data: [
						{
							phrase: "How sad",
							translation: pron.interrogative.words.que,
							reference: { "pron.interrogative.words.que": [0] },
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "The girl",
							translation: artcl.words.la,
							phraseTranslation: "LA girl",
						},
						{
							phrase: "didn't win",
							translation: advrb.words.no,
							phraseTranslation: "NO won",
							reference: { "advrb.words.no": [7] },
						},
					],
				},
				{
					id: 6,
					sentence: "She and I said he was with him",
					translation: "She Y I said QUE he was CON him",
					data: [
						{
							phrase: "She",
						},
						{
							phrase: "and",
							translation: conj.words.y,
						},
						{
							phrase: "I",
						},
						{
							phrase: "said",
							translation: conj.words.que,
							phraseTranslation: "said QUE",
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "he was",
						},
						{
							phrase: "with",
							translation: prep.words.con,
						},
						{
							phrase: "him",
						},
					],
				},
				{
					id: 7,
					sentence: "That it's a paper airplane amuses me",
					translation: "QUE it's an airplace DE paper ME amuses",
					data: [
						{
							phrase: "That",
							translation: conj.words.que,
						},
						{
							phrase: "it's a",
						},
						{
							phrase: "paper airplane",
							phraseTranslation: "airplace DE paper",
							translation: [prep.words.de],
							reference: { "prep.words.de": [4] },
						},
						{
							phrase: "amuses me",
							phraseTranslation: "ME amuses",
							translation: pron.dObj.words.me,
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 8,
					sentence: "Why did he go along this street?",
					translation: "POR QUE did he go POR this street?",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							phraseTranslation: "POR QUE",
							reference: ref("porQueWhy"),
						},
						{
							phrase: "did he go",
						},
						{
							phrase: "along",
							translation: prep.words.por,
							reference: ref("porAlong"),
						},
						{
							phrase: "this street",
						},
					],
				},
				{
					id: 9,
					sentence: "A man did it so that she would find you",
					translation: "UN man LO did PARA QUE she TE would find",
					data: [
						{
							phrase: "A man",
							translation: artcl.words.un,
							phraseTranslation: "UN man",
						},
						{
							phrase: "did it",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO did",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "so that",
							translation: [prep.words.para, conj.words.que],
							phraseTranslation: "PARA QUE",
							reference: ref("paraQueConj"),
						},
						{
							phrase: "She would find you",
							translation: [pron.dObj.words.te],
							phraseTranslation: "She TE would find",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 10,
					sentence: "This can't be becasue of a girl",
					translation: "This NO can be POR UNA girl",
					data: [
						{
							phrase: "This",
						},
						{
							phrase: "can't be",
							translation: advrb.words.no,
							phraseTranslation: "NO can be",
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{
							phrase: "a girl",
							translation: artcl.words.una,
							phraseTranslation: "UNA girl",
						},
					],
				},
				{
					id: 11,
					sentence: "How funny that that wasn't for him",
					translation: "QUÉ funny QUE ESO NO was PARA him",
					data: [
						{
							phrase: "How funny",
							translation: conj.words.que,
							phraseTranslation: "Que funny",
							reference: { "pron.interrogative.words.que": [0] },
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "wasn't",
							translation: advrb.words.no,
							phraseTranslation: "NO was",
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "for",
							translation: prep.words.para,
							reference: { "prep.words.para": [0] },
						},
						{ phrase: "him" },
					],
				},
				{
					id: 12,
					sentence: "What do you do around here?",
					translation: "Que do you do POR here?",
					data: [
						{
							phrase: "What",
							translation: pron.interrogative.words.que,
						},
						{
							phrase: "do you do",
						},
						{
							phrase: "around",
							translation: prep.words.Por,
							reference: ref("porLocation"),
						},
						{
							phrase: "here",
						},
					],
				},
				{
					id: 13,
					sentence: "I met them(F) at the park, how unlikely!",
					translation: "I LAS met EN the park, QUE unlikely!",
					data: [
						{ phrase: "I" },
						{
							phrase: "met them(F)",
							translation: pron.dObj.words.las,
							phraseTranslation: "LAS met",
							reference: { "pron.dObj.words.las": [1] },
						},
						{
							phrase: "at",
							translation: prep.words.en,
						},
						{ phrase: "the" },
						{ phrase: "park" },
						{
							phrase: "how unlikely",
							translation: pron.interrogative.words.que,
							phraseTranslation: "QUÉ unlikely",
							reference: { "pron.interrogative.words.que": [0] },
						},
					],
				},
				{
					id: 14,
					sentence: "He is from Peru, that's why the guys know him",
					translation: "He is DE Peru, POR ESO LOS guys LO know",
					data: [
						{ phrase: "He is" },
						{
							phrase: "from",
							translation: prep.words.de,
						},
						{
							phrase: "Peru",
						},
						{
							phrase: "that's why",
							translation: [prep.words.por, pron.demonstrative.words.eso],
							phraseTranslation: "POR ESO",
							reference: ref("porEso"),
						},
						{
							phrase: "the",
							translation: artcl.words.los,
						},
						{ phrase: "guys" },
						{
							phrase: "know him",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO know",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 15,
					sentence: "The man will be at the bank at 1:30",
					translation: "EL man will be EN the bank A 1:30",
					data: [
						{ phrase: "The", translation: artcl.words.el },
						{ phrase: "man" },
						{
							phrase: "will be",
						},
						{
							phrase: "at",
							translation: prep.words.en,
						},
						{ phrase: "the" },
						{ phrase: "bank" },
						{
							phrase: "at 1:30",
							translation: prep.words.a,
							phraseTranslation: "A 1:30",
							reference: { "prep.words.a": [0] },
						},
					],
				},
				{
					id: 16,
					sentence: "How nice that the girl found her",
					translation: "QUÉ nice QUE LA girl LA found",
					data: [
						{
							phrase: "How nice",
							translation: pron.interrogative.words.que,
							phraseTranslation: "QUÉ nice",
							reference: { "pron.interrogative.words.que": [0] },
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "the",
							translation: artcl.words.la,
						},
						{ phrase: "girl" },
						{
							phrase: "found her",
							translation: pron.dObj.words.la,
							phraseTranslation: "LA found",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 17,
					sentence: "That should impress them(M) by tomorrow",
					translation: "ESO LOS should impress PARA tomorrow",
					data: [
						{
							phrase: "That",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "should impress them",
							translation: pron.dObj.words.los,
							phraseTranslation: "LOS should impress",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "by",
							translation: prep.words.para,
							reference: { "prep.words.para": [2] },
						},
						{
							phrase: "tomorrow",
						},
					],
				},
				{
					id: 18,
					sentence: "My mom's book is by a Columbian author (M)",
					translation: "The book DE my mom is POR UN columbian author",
					data: [
						{
							phrase: "My mom's book",
							translation: prep.words.de,
							phraseTranslation: "The book DE my mom",
							reference: { "prep.words.de": [2] },
						},
						{
							phrase: "is",
						},
						{
							phrase: "by",
							translation: prep.words.Por,
							reference: ref("porCauseBy"),
						},
						{
							phrase: "A",
							translation: artcl.words.un,
						},
						{
							phrase: "Columbian author(M)",
						},
					],
				},
				{
					id: 19,
					sentence: "The ladies said that so that I would find him",
					translation: "LAS ladies said ESO PARA QUE I LO would find",
					data: [
						{
							phrase: "The",
							translation: artcl.words.las,
						},
						{ phrase: "ladies" },
						{
							phrase: "said",
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "so that",
							translation: [prep.words.para, conj.words.que],
							phraseTranslation: "PARA QUE",
							reference: { "prep.words.para": [5] },
						},
						{
							phrase: "I would find him",
							translation: pron.dObj.words.lo,
							phraseTranslation: "I LO would find",
							reference: ref("dObjPosition"),
						},
					],
				},
			],
		},
		{
			lesson: 12,
			name: "Lesson 12",
			details: "Verbs: ES means IS in Spanish!",
			wordBank: [verb.words.ser.present.es],
			info: [
				verb.info[4],
				verb.info[5],
				verb.info[6],
				verb.info[7],
				verb.info[8],
				verb.words.ser.present.es.info[0],
				"ES is actually a CONJUGATION of SER, which we will discuss next lesson, it is also the 7th most common word!",
				verb.words.ser.present.es.info[1],
				verb.words.ser.present.es.info[2],
				"For all the sentences in this lesson we will only be using IS/ES if it has a noun right after it, to describe WHAT that SOMETHING is! Basically if there's not a noun after IS don't translate it as ES, leave as English.",
			],
			sentences: [
				{
					id: 1,
					sentence: "The girl in the car is my friend",
					translation: "LA girl EN the car ES my friend",
					data: [
						{
							phrase: "The",
							translation: artcl.words.la,
						},
						{ phrase: "girl" },
						{
							phrase: "in",
							translation: prep.words.en,
						},
						{
							phrase: "the",
						},
						{ phrase: "car" },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "my friend",
						},
					],
				},
				{
					id: 2,
					sentence: "The man with glasses is a nice guy",
					translation: "EL man CON glasses ES UN nice guy",
					data: [
						{
							phrase: "The",
							translation: artcl.words.el,
						},
						{ phrase: "man" },
						{
							phrase: "with",
							translation: prep.words.con,
						},
						{
							phrase: "glasses",
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "a",
							translation: artcl.words.un,
						},
						{
							phrase: "nice guy",
						},
					],
				},
				{
					id: 3,
					sentence: "What is that?",
					translation: "Que es eso?",
					data: [
						{
							phrase: "What",
							translation: pron.interrogative.words.que,
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
					],
				},
				{
					id: 4,
					sentence: "Yes, that's why the book is on the table",
					translation: "Yes, POR ESO the book is ON the table",
					data: [
						{
							phrase: "Yes",
						},
						{
							phrase: "that's why",
							translation: [prep.words.por, pron.demonstrative.words.eso],
							phraseTranslation: "POR ESO",
							reference: ref("porEso"),
						},
						{
							phrase: "the book",
						},
						{
							phrase: "is on",
							translation: [prep.words.en],
							phraseTranslation: "is EN",
							reference: ref("serNoLocation"),
						},
						{ phrase: "the table" },
					],
				},
				{
					id: 5,
					sentence: "This is my mom's dog(F)",
					translation: "This ES LA dog DE my mom",
					data: [
						{
							phrase: "This",
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "my mom's dog(F)",
							translation: [artcl.words.la, prep.words.de],
							phraseTranslation: "LA dog DE my mom",
						},
					],
				},
				{
					id: 6,
					sentence: "He is here during the mornings",
					translation: "He is here POR the mornings",

					data: [
						{
							phrase: "He is here during",
							phraseTranslation: "He is here POR",
							translation: prep.words.por,
							reference: ref("serNoLocation", "porDuring"),
						},
						{
							phrase: "the mornings",
						},
					],
				},
				{
					id: 7,
					sentence: "How embarrassing",
					translation: "Que embarrassing",
					data: [
						{
							phrase: "How",
							translation: pron.interrogative.words.que,
							reference: { "pron.interrogative.words.que": [0] },
						},
						{
							phrase: "embarrassing",
						},
					],
				},
				{
					id: 8,
					sentence: "I made dinner so that you could rest",
					translation: "I made dinner PARA QUE you could rest",
					data: [
						{
							phrase: "I made dinner",
						},
						{
							phrase: "so that",
							translation: [prep.words.para, conj.words.que],
							phraseTranslation: "PARA QUE",
							reference: { "prep.words.para": [5] },
						},
						{
							phrase: "you could rest",
						},
					],
				},
				{
					id: 9,
					sentence: "Why did you walk along this road in the snow?",
					translation: "POR QUE did you walk POR this road EN the snow?",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							phraseTranslation: "POR QUE",
							reference: ref("porQueWhy"),
						},
						{
							phrase: "did you walk",
						},
						{
							phrase: "along",
							translation: prep.words.por,
							reference: ref("porAlong"),
						},
						{
							phrase: "this road",
						},
						{
							phrase: "in",
							translation: prep.words.en,
						},
						{
							phrase: "the snow",
						},
					],
				},
				{
					id: 10,
					sentence: "This is a paper book by a young author(M)",
					translation: "This ES a book DE paper POR UN young author",
					data: [
						{
							phrase: "This",
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "a",
						},
						{
							phrase: "paper book",
							phraseTranslation: "book DE paper",
							translation: prep.words.de,
							reference: ref("deMaterial"),
						},
						{
							phrase: "by",
							translation: prep.words.por,
							reference: ref("porCauseBy"),
						},
						{
							phrase: "a",
							translation: [artcl.words.un],
						},
						{
							phrase: "young author(M)",
						},
					],
				},
				{
					id: 11,
					sentence: "This is the man who met them(M).",
					translation: "This ES EL man who LOS met.",
					data: [
						{
							phrase: "This",
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "the man",
							translation: [artcl.words.el],
							phraseTranslation: "EL man",
						},
						{
							phrase: "who",
						},
						{
							phrase: "met them",
							translation: pron.dObj.words.los,
							phraseTranslation: "LOS met",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 12,
					sentence: "You can't do better than that",
					translation: "You NO can do better QUE ESO",
					data: [
						{
							phrase: "You",
						},
						{
							phrase: "can't do",
							translation: advrb.words.no,
							phraseTranslation: "NO can do",
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "better",
						},
						{
							phrase: "than",
							translation: conj.words.que,
							reference: ref("queAsThan"),
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
					],
				},
				{
					id: 13,
					sentence: "He is always at work at 7:00",
					translation: "He is always EN work A 7:00",
					data: [
						{
							phrase: "He is always at",
							translation: prep.words.en,
							phraseTranslation: "He is always EN",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "at",
							translation: prep.words.en,
						},
						{
							phrase: "work",
						},
						{
							phrase: "at",
							translation: prep.words.a,
							reference: { "prep.words.a": [0] },
						},
						{
							phrase: "7:00",
						},
					],
				},
				{
					id: 14,
					sentence: "We made this for you, because of your good work",
					translation: "We made this PARA you, POR your good work",
					data: [
						{
							phrase: "We made this",
						},
						{
							phrase: "for",
							translation: prep.words.para,
							reference: { "prep.words.para": [0] },
						},
						{
							phrase: "you",
						},
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{
							phrase: "your good work",
						},
					],
				},
				{
					id: 15,
					sentence: "How strange that this is translated into Spanglish",
					translation: "Que strange QUE this is translated into Spanglish",
					data: [
						{
							phrase: "How strange",
							translation: pron.interrogative.words.que,
							phraseTranslation: "Qué strange",
							reference: { "pron.interrogative.words.que": [0] },
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "this is translated into Spanglish",
						},
					],
				},
				{
					id: 16,
					sentence: "Sara's son saw them(M) with that",
					translation: "EL son DE sara LOS saw CON ESO",
					data: [
						{
							phrase: "Sara's son",
							translation: [artcl.words.el, prep.words.de],
							phraseTranslation: "EL son DE sara",
							reference: ref("dePossession"),
						},
						{
							phrase: "saw them(M)",
							translation: pron.dObj.words.los,
							phraseTranslation: "LOS saw",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "with",
							translation: prep.words.con,
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
					],
				},
				{
					id: 17,
					sentence: "This is the homework that I must do by tonight",
					translation: "This ES the homework QUE I must do PARA tonight",
					data: [
						{
							phrase: "This",
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "the homework",
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "I must do",
						},
						{
							phrase: "by",
							translation: prep.words.para,
							reference: ref("paraDeadlines"),
						},
						{
							phrase: "tonight",
						},
					],
				},
				{
					id: 18,
					sentence: "The girl that is walking near the park is my friend",
					translation: "LA girl QUE is walking POR the park ES my friend",
					data: [
						{
							phrase: "The",
							translation: artcl.words.la,
						},
						{
							phrase: "girl",
						},
						{
							phrase: "that is walking",
							translation: conj.words.que,
							phraseTranslation: "QUE is walking",
							reference: ref("serNoDoing"),
						},
						{
							phrase: "near",
							translation: prep.words.por,
							reference: ref("porLocation"),
						},
						{
							phrase: "the park",
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "my friend",
						},
					],
				},
			],
		},
		{
			lesson: 13,
			name: "Lesson 13",
			details: "Verbs: Conjugating SER",
			wordBank: [
				verb.words.ser.present.soy,
				verb.words.ser.present.eres,
				verb.words.ser.present.es,
				verb.words.ser.present.somos,
				verb.words.ser.present.son,
			],
			info: [
				"We learned the word ES for IS, but ES is only one small part of SER, a big Spanish verb with many different forms to learn.",
				'It turns out we use different forms of verbs in English too, changing the word "is" to different forms, like "are" "am" etc.',
				verb.info[10],
				'The parent word of "are" "is" "am" etc. is TO BE, or in Spanish SER. So ES is just one of many forms of SER, like IS is a form of TO BE.',
				'We are learning "Conjugating" which is changing the verb to agree with the context of the sentence it is a part of. I AM, you ARE, he IS',
				verb.info[11],
				"Conjugations for SER: \nI am = I SOY \nYou are = You ERES \nHe/She/It is = He/She/It ES \nWe are = We SOMOS \nThey are = They SON",
				"What about the word SER itself? It's the equivalent of the term 'to be' in English. SER is the name of the verb, representing all the conjugations we've learned so far. \n'Is', 'Are', 'Am', are all conjugations of 'to be' just as ES, ERES, and SOY are all conjugations of SER!",
				"Remember we are still only translating the IS/ES version of SER if it is SPECIFICALLY referring to WHAT something is, not where, or how, or what it is doing. Just what it is.",
			],
			sentences: [
				{
					id: 1,
					sentence: "We are students",
					translation: "We SOMOS students",
					data: [
						{
							phrase: "We",
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.somos,
						},
						{
							phrase: "students",
						},
					],
				},
				{
					id: 2,
					sentence: "I am his daughter",
					translation: "I SOY his daughter",
					data: [
						{
							phrase: "I",
						},
						{
							phrase: "am",
							translation: verb.words.ser.present.soy,
						},
						{
							phrase: "his daughter",
						},
					],
				},
				{
					id: 3,
					sentence: "They are students",
					translation: "They SON students",
					data: [
						{
							phrase: "They",
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
						},
						{
							phrase: "students",
						},
					],
				},
				{
					id: 4,
					sentence: "You are my cousin",
					translation: "You ERES my cousin",
					data: [
						{
							phrase: "You",
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.eres,
						},
						{
							phrase: "my cousin",
						},
					],
				},
				{
					id: 5,
					sentence: "I like to be a student",
					translation: "I like SER a student",
					data: [
						{
							phrase: "I like",
						},
						{
							phrase: "to be",
							translation: verb.words.ser,
						},
						{
							phrase: "a student",
						},
					],
				},
				{
					id: 6,
					sentence: "To be president would be cool",
					translation: "SER president would be cool",
					data: [
						{
							phrase: "To be",
							translation: verb.words.ser,
						},
						{
							phrase: "president would be cool",
						},
					],
				},
				{
					id: 7,
					sentence: "I want to be a good student",
					translation: "I want SER a good student",
					data: [
						{
							phrase: "I want",
						},
						{
							phrase: "to be",
							translation: verb.words.ser,
						},
						{
							phrase: "a good student",
						},
					],
				},
				{
					id: 8,
					sentence: "They want to be good friends",
					translation: "They want SER good friends",
					data: [
						{
							phrase: "They want",
						},
						{
							phrase: "to be",
							translation: verb.words.ser,
						},
						{
							phrase: "good friends",
						},
					],
				},
				{
					id: 9,
					sentence: "What is there in the kitchen?",
					translation: "QUÉ is there in the kitchen?",
					data: [
						{
							phrase: "What is there",
							translation: pron.interrogative.words.que,
							reference: ref("serNoLocation"),
						},
						{
							phrase: "in the kitchen?",
						},
					],
				},
				{
					id: 10,
					sentence: "She and I are sisters",
					translation: "She Y I SOMOS sisters",
					data: [
						{
							phrase: "She",
						},
						{
							phrase: "and",
							translation: conj.words.y,
						},
						{
							phrase: "I",
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.somos,
						},
						{
							phrase: "sisters",
						},
					],
				},
				{
					id: 11,
					sentence: "They are my friends.",
					translation: "They SON my friends.",
					data: [
						{
							phrase: "They",
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
						},
						{
							phrase: "my friends.",
						},
					],
				},
				{
					id: 12,
					sentence: "That is a problem",
					translation: "ESO ES a problem",
					data: [
						{
							phrase: "That",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "a problem",
						},
					],
				},
				{
					id: 13,
					sentence: "I am working with them",
					translation: "I am working CON them",
					data: [
						{
							phrase: "I am working with",
							translation: prep.words.con,
							phraseTranslation: "I am working CON",
							reference: ref("serNoDoing"),
						},
						{
							phrase: "them",
						},
					],
				},
				{
					id: 14,
					sentence: "This is my brother",
					translation: "This ES my brother",
					data: [
						{
							phrase: "This",
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "my brother",
						},
					],
				},
				{
					id: 15,
					sentence: "I am a good guy, really!",
					translation: "I SOY UN good guy, really!",
					data: [
						{
							phrase: "I",
						},
						{
							phrase: "am",
							translation: verb.words.ser.present.soy,
						},
						{
							phrase: "a",
							translation: artcl.words.un,
						},
						{
							phrase: "good guy, really!",
						},
					],
				},
				{
					id: 16,
					sentence: "I think they are running around here.",
					translation: "I think QUE they are running POR here.",
					data: [
						{
							phrase: "I think",
							translation: conj.words.que,
							phraseTranslation: "I think QUE",
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "they",
						},
						{
							phrase: "are running around",
							phraseTranslation: "are running POR",
							translation: prep.words.por,
							reference: ref("serNoDoing", "porLocation"),
						},
						{
							phrase: "here.",
						},
					],
				},
				{
					id: 17,
					sentence: "The man and the woman are my relatives",
					translation: "EL man Y LA woman SON my relatives",
					data: [
						{
							phrase: "The",
							translation: artcl.words.el,
						},
						{
							phrase: "man",
						},
						{
							phrase: "and",
							translation: conj.words.y,
						},
						{
							phrase: "the",
							translation: artcl.words.la,
						},
						{
							phrase: "woman",
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.somos,
						},
						{
							phrase: "my relatives",
						},
					],
				},
				{
					id: 18,
					sentence: "I promise I am a good student(F)",
					translation: "I promise QUE I SOY UNA good student",
					data: [
						{
							phrase: "I promise",
							translation: conj.words.que,
							phraseTranslation: "I promise QUE",
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "I",
						},
						{
							phrase: "am",
							translation: verb.words.ser.present.soy,
						},
						{
							phrase: "a",
							translation: artcl.words.una,
						},
						{
							phrase: "good student",
						},
					],
				},
				{
					id: 19,
					sentence: "You aren't a model student(F)?",
					translation: "You NO ERES UNA model student?",
					data: [
						{
							phrase: "You",
						},
						{
							phrase: "aren't",
							translation: [verb.words.ser.present.eres, advrb.words.no],
							phraseTranslation: "NO ERES",
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "a",
							translation: artcl.words.una,
						},
						{
							phrase: "model student(F)",
						},
					],
				},
				{
					id: 20,
					sentence: "You are in the wrong place",
					translation: "You are EN the wrong place",
					data: [
						{
							phrase: "You are in",
							translation: prep.words.en,
							phraseTranslation: "You are EN",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "the wrong place",
						},
					],
				},
				{
					id: 21,
					sentence: "That is slipping away",
					translation: "ESO is slipping away",
					data: [
						{
							phrase: "That is slipping",
							translation: pron.demonstrative.words.eso,
							phraseTranslation: "ESO is slipping",
							reference: ref("serNoDoing"),
						},
						{
							phrase: "away",
						},
					],
				},
				{
					id: 22,
					sentence: "He wants to be governor",
					translation: "He wants SER governor",
					data: [
						{
							phrase: "He wants",
						},
						{
							phrase: "to be",
							translation: verb.words.ser,
						},
						{
							phrase: "governor",
						},
					],
				},
				{
					id: 23,
					sentence: "The ladies know them(F)",
					translation: "LAS ladies LAS know",
					data: [
						{
							phrase: "The",
							translation: artcl.words.las,
						},
						{
							phrase: "ladies",
						},
						{
							phrase: "know them(F)",
							translation: pron.dObj.words.las,
							phraseTranslation: "LAS know",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 24,
					sentence: "You are not my mother",
					translation: "You NO ERES my mother",
					data: [
						{
							phrase: "You",
						},
						{
							phrase: "aren't",
							translation: [verb.words.ser.present.eres, advrb.words.no],
							phraseTranslation: "NO ERES",
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "my mother",
						},
					],
				},
				{
					id: 25,
					sentence: "Why didn't the girl see them(M)?",
					translation: "POR QUE LA girl NO LOS saw",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							phraseTranslation: "POR QUE",
							reference: ref("porQueWhy"),
						},
						{
							phrase: "didn't the girl",
							translation: [artcl.words.la, advrb.words.no],
							phraseTranslation: "NO did LA girl",
							reference: { "advrb.words.no": [7] },
						},
						{
							phrase: "see them(M)",
							translation: pron.dObj.words.los,
							phraseTranslation: "LOS saw",
						},
					],
				},
				{
					id: 26,
					sentence: "The guys are with someone",
					translation: "LOS guys are CON someone",
					data: [
						{
							phrase: "The",
							translation: artcl.words.los,
						},
						{
							phrase: "guys",
						},
						{
							phrase: "are with",
							translation: prep.words.con,
							phraseTranslation: "are CON",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "someone",
						},
					],
				},
				{
					id: 27,
					sentence: "We are friends and that is a good thing",
					translation: "We SOMOS friends Y ESO ES a good thing",
					data: [
						{
							phrase: "We",
						},
						{
							phrase: "are",
							mixup: verb.words.ser.present.somos,
						},
						{
							phrase: "friends",
						},
						{
							phrase: "and",
							translation: conj.words.y,
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "a good thing",
						},
					],
				},
			],
		},
		{
			lesson: 14,
			name: "Lesson 14",
			details: "Disappearing Subject Pronouns",
			info: [
				"What is the reason you can form Spanish sentences WITHOUT using nouns OR pronouns? \nIt's all to do with a core difference between English and Spanish VERBS.",
				"Think about the forms of SER we've learned. Spanish has FIVE different forms all specific to WHOME it's talking about. \nThat isn't true in English where we would say I AM, you ARE, we ARE, they ARE, she IS. Which is only THREE different words.",
				"In Spanish those words are clearly distinct, specific to who it is that is being talked about. In English if you see 'are' out of context you wouldn't know who it's referring to.",
				"However if you see the word SOMOS in spanish it can ONLY be referring to 'WE'",
				"That allows the Subject Pronouns in Spanish to very often just disappear.",
				"Subject pronouns are any word that is interchangeable with HE, like 'we' 'I' and 'she' etc.. Unlike the previously learned direct object pronouns which are interchangeable with HIM, like 'her' and 'them'.",
				"Consider the sentence: 'He hugged him' HE is the subj pron. and HIM is the dObj pron.",
				"In English we don't leave out subject pronouns always saying things like 'We are friends', where is Spanish you could say simply 'SOMOS friends'",
				"You are allowed to use subject pronouns in Spanish, like 'You ERES a nice person' but why bother putting YOU in there, it's already clear from the specificity of ERES who it is you are talking to.",
				"Whether you use the subject pronoun in Spanish depends on how much information you need in the specific context. Say if the subject of the sentence is a whole named noun, you would still include it. Like: 'My DOG es my best friend', but if you have been talking about your dog and it's clear who you are referring to you would just say 'ES my best friend'",
				"One situation in which you would make sure to keep the subject pronoun is when you need to differentiate between two people, like 'SHE no es una thief, HE es un thief'.",
				"Another situation is if you are using emphasis, such as: 'THEY aren't your friends, I am you friend' , They NO SON your friends, I SOY your friend.",
				"Basically, include a subject prounoun if: it's a named noun, or if you need a subject pronoun for emphasis or clarification.",
				"This obviously creates a dilemma where there may subjectively be multiple correct answers. We will notate which sentences do not require Subject Pronouns for now, but this will change.",
			],
			sentences: [
				{
					id: 1,
					sentence: "They are of wood",
					translation: "SON DE wood",
					data: [
						{
							phrase: "They are",
							translation: verb.words.ser.present.son,
							noPronoun: true,
						},
						{
							phrase: "of wood",
							phraseTranslation: "DE wood",
							translation: prep.words.de,
						},
					],
				},
				{
					id: 2,
					sentence: "The girls are my daughters",
					translation: "Las girls SON my daughters",
					data: [
						{
							phrase: "The",
							translation: artcl.words.las,
						},
						{
							phrase: "girls",
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
						},
						{
							phrase: "my daughters",
						},
					],
				},
				{
					id: 3,
					sentence: "The boys and I are brothers",
					translation: "LOS boys Y I SOMOS brothers",
					data: [
						{
							phrase: "The",
							translation: artcl.words.los,
						},
						{
							phrase: "boys",
						},
						{
							phrase: "and",
							translation: conj.words.y,
						},
						{
							phrase: "I",
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.somos,
						},
						{
							phrase: "brothers",
						},
					],
				},
				{
					id: 4,
					sentence: "I'm a local",
					translation: "SOY a local",
					data: [
						{
							phrase: "I'm",
							translation: verb.words.ser.present.soy,
							noPronoun: true,
						},
						{
							phrase: "a local",
						},
					],
				},
				{
					id: 5,
					sentence: "He's a thief!",
					translation: "ES UN thief!",
					data: [
						{
							phrase: "He's",
							translation: verb.words.ser.present.es,
							noPronoun: true,
						},
						{
							phrase: "a",
							translation: artcl.words.un,
						},
						{
							phrase: "thief",
						},
					],
				},
				{
					id: 6,
					sentence: "I'm his son",
					translation: "SOY his son",
					data: [
						{
							phrase: "I'm",
							translation: verb.words.ser.present.soy,
							noPronoun: true,
						},
						{
							phrase: "his son",
						},
					],
				},
				{
					id: 7,
					sentence: "She's not the winner, he's the winner",
					translation: "She NO ES LA winner, he ES EL winner",
					data: [
						{
							phrase: "She's not",
							phraseTranslation: "She NO ES",
							translation: [verb.words.ser.present.es, advrb.words.no],
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "the",
							translation: artcl.words.la,
						},
						{
							phrase: "winner",
						},
						{
							phrase: "he's",
							phraseTranslation: "he ES",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "the",
							translation: artcl.words.el,
						},
						{
							phrase: "winner",
						},
					],
				},
				{
					id: 8,
					sentence: "You're the guy that saw him",
					translation: "ERES EL guy QUE LO saw",
					data: [
						{
							phrase: "You're",
							translation: verb.words.ser.present.eres,
							noPronoun: true,
						},
						{
							phrase: "the",
							translation: artcl.words.el,
						},
						{
							phrase: "guy",
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "saw him",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO saw",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 9,
					sentence: "No, HE is the man that did it",
					translation: "NO, he ES EL man QUE LO did",
					data: [
						{
							phrase: "No",
							translation: advrb.words.no,
						},
						{
							phrase: "he is",
							translation: verb.words.ser.present.es,
							phraseTranslation: "he ES",
						},
						{
							phrase: "the",
							translation: artcl.words.el,
						},
						{
							phrase: "man",
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "did it",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO did",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 10,
					sentence: "Yes, that's why you're my friend",
					translation: "Yes, POR ESO ERES my friend",
					data: [
						{ phrase: "Yes" },
						{
							phrase: "that's why",
							translation: [prep.words.por, pron.demonstrative.words.eso],
							phraseTranslation: "POR ESO",
							reference: ref("porEso"),
						},
						{
							phrase: "you're",
							translation: verb.words.ser.present.eres,
							noPronoun: true,
						},
						{
							phrase: "my friend",
						},
					],
				},
				{
					id: 11,
					sentence: "She isn't the teacher, he is the teacher",
					translation: "She NO ES LA teacher, he ES EL teacher",
					data: [
						{
							phrase: "She isn't",
							phraseTranslation: "She NO ES",
							translation: [verb.words.ser.present.es, advrb.words.no],
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "the",
							translation: artcl.words.la,
						},
						{
							phrase: "teacher",
						},
						{
							phrase: "he is",
							phraseTranslation: "he ES",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "the",
							translation: artcl.words.el,
						},
						{
							phrase: "teacher",
						},
					],
				},
				{
					id: 12,
					sentence: "I brought her so that she could take over",
					translation: "I LA brought PARA QUE she could take over",
					data: [
						{ phrase: "I" },
						{
							phrase: "brought her",
							translation: pron.dObj.words.la,
							phraseTranslation: "LA brought",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "so that",
							translation: [prep.words.para, conj.words.que],
							reference: { "prep.words.para": [4] },
							phraseTranslation: "PARA QUE",
						},
						{
							phrase: "she could take over",
						},
					],
				},
				{
					id: 13,
					sentence: "We're very good friends",
					translation: "SOMOS very good friends",
					data: [
						{
							phrase: "We're",
							translation: verb.words.ser.present.somos,
							noPronoun: true,
						},
						{
							phrase: "very good friends",
						},
					],
				},
				{
					id: 14,
					sentence: "To be a student sounds better than that",
					translation: "SER a student sounds better QUE ESO",
					data: [
						{
							phrase: "To be",
							translation: verb.words.ser,
						},
						{
							phrase: "a student sounds better",
						},
						{
							phrase: "than",
							translation: conj.words.que,
							reference: ref("queAsThan"),
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
					],
				},
				{
					id: 15,
					sentence: "Wait, they(M) are the winners?",
					translation: "Wait, they SON LOS winners?",
					data: [
						{
							phrase: "Wait",
						},
						{
							phrase: "they are",
							phraseTranslation: "they SON",
							translation: verb.words.ser.present.son,
						},
						{
							phrase: "the",
							translation: artcl.words.los,
						},
						{
							phrase: "winners(M)",
						},
					],
				},
				{
					id: 16,
					sentence: "She isn't my dog, He is my dog.",
					translation: "She NO ES my dog, He ES my dog.",
					data: [
						{
							phrase: "She isn't",
							phraseTranslation: "She NO ES",
							translation: [verb.words.ser.present.es, advrb.words.no],
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "my dog",
						},
						{
							phrase: "He is",
							phraseTranslation: "He ES",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "my dog",
						},
					],
				},
				{
					id: 17,
					sentence: "Not them, We are the winners(F).",
					translation: "NO them, We SOMOS LAS winners.",
					data: [
						{
							phrase: "Not",
							translation: advrb.words.no,
						},
						{
							phrase: "them",
						},
						{
							phrase: "We are",
							translation: verb.words.ser.present.somos,
							phraseTranslation: "We SOMOS",
						},
						{
							phrase: "the",
							translation: artcl.words.las,
						},
						{
							phrase: "winners(F)",
						},
					],
				},
				{
					id: 18,
					sentence: "I am your teacher so that you can learn physics.",
					translation: "I SOY your teacher PARA QUE you can learn physics.",
					data: [
						{
							phrase: "I am",
							translation: verb.words.ser.present.soy,
							phraseTranslation: "I SOY",
						},
						{
							phrase: "your teacher",
						},
						{
							phrase: "so that",
							translation: [prep.words.para, conj.words.que],
							reference: { "prep.words.para": [4] },
							phraseTranslation: "PARA QUE",
						},
						{
							phrase: "you can learn physics",
						},
					],
				},
				{
					id: 19,
					sentence: "How strange that he runs faster than her!",
					translation: "QUÉ strange QUE he runs faster QUE her!",
					data: [
						{
							phrase: "How strange",
							translation: pron.interrogative.words.que,
							reference: { "pron.interrogative.words.que": [0] },
							phraseTranslation: "QUÉ strange",
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "he runs faster",
						},
						{
							phrase: "than",
							translation: conj.words.que,
							reference: { "conj.words.que": [3] },
						},
						{
							phrase: "her",
						},
					],
				},
				{
					id: 20,
					sentence: "I brought him because he wants to be president!",
					translation: "I LO brought because he wants SER president!",
					data: [
						{
							phrase: "I brought him",
							translation: pron.dObj.words.lo,
							phraseTranslation: "I LO brought",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "because he wants",
						},
						{ phrase: "to be", translation: verb.words.ser },
						{
							phrase: "president",
						},
					],
				},
				{
					id: 21,
					sentence: "We(F) are not the teachers, THEY(F) are the teachers.",
					translation: "We NO SOMOS LAS teachers, they SON LAS teachers.",
					data: [
						{
							phrase: "We(F) are not",
							translation: [verb.words.ser.present.somos, advrb.words.no],
							phraseTranslation: "We NO SOMOS",
						},
						{
							phrase: "the",
							translation: artcl.words.las,
						},
						{
							phrase: "teachers",
						},
						{
							phrase: "they(F) are",
							translation: verb.words.ser.present.son,
							phraseTranslation: "they SON",
						},
						{
							phrase: "the",
							translation: artcl.words.las,
						},
						{
							phrase: "teachers",
						},
					],
				},
			],
			wordBank: [],
		},
		{
			lesson: 15,
			name: "Lesson 15",
			details: "REVIEW: Ser and Everything Else!",
			info: [
				"I'm sure we're ready to get past Spanglish and on to sentences entirely in Spanish, it will happen soon, just remember this is all part of a proven process.",
				"If our journey so far has been like climbing a mountain, we are currently on a steep climb through the thick jungle!",
				"There is a reason for this difficult beginning, and it's that when we do start presenting some sentences entirely in Spanish, which will be SOON, you will actually have an inredibly easy time!!",
				"Soon we will break through to a high point and see the sun shining through, you'll be able to envision a map of the whole language laid out clearly in front of you.",
				"For this quiz when we use SER conjugations such as ES or SOMOS we will still specifically mention if the subject pronouns are not included. We will learn the Spanish words for the subject pronouns soon as well!",
				"Additionally keep an eye out for when SER should be used, if it is SPECIFICALLY referring to WHAT something is, not WHERE, or HOW, or what it is DOING. Just what it is.",
			],
			sentences: [
				{
					id: 1,
					sentence: "They are with your dad's sister.",
					translation: "They are CON LA sister DE your dad.",
					data: [
						{
							phrase: "They are with",
							phraseTranslation: "They are CON",
							reference: ref("serNoLocation"),
							translation: prep.words.con,
						},
						{
							phrase: "your dad's sister",
							phraseTranslation: "LA sister DE your dad",
							translation: [artcl.words.la, prep.words.de],
							reference: ref("dePossessionContractions"),
						},
					],
				},
				{
					id: 2,
					sentence: "I can see that amused you",
					translation: "I can see QUE ESO TE amused",
					data: [
						{
							phrase: "I can see that",
							reference: { "conj.words.que": [0] },
							phraseTranslation: "I can see QUE ESO",
							translation: [conj.words.que, pron.demonstrative.words.eso],
						},
						{
							phrase: "amused you",
							translation: pron.dObj.words.te,
							phraseTranslation: "TE amused",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 3,
					sentence: "She and I are the first people in the place",
					translation: "She Y I are the first people EN the place",
					data: [
						{
							phrase: "She and I are",
							translation: [verb.words.ser.present.somos, conj.words.y],
							phraseTranslation: "She Y I are",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "the first people",
						},
						{
							phrase: "in",
							translation: prep.words.en,
						},
						{
							phrase: "the place",
						},
					],
				},
				{
					id: 4,
					sentence: "You're my best friend",
					translation: "ERES my best friend",
					data: [
						{
							phrase: "You're",
							translation: verb.words.ser.present.eres,
							noPronoun: true,
						},
						{
							phrase: "my best friend",
						},
					],
				},
				{
					id: 5,
					sentence: "I saw them(M) walking out of the school",
					translation: "I LOS saw walking out DE the school",
					data: [
						{
							phrase: "I saw them(M)",
							translation: pron.dObj.words.los,
							phraseTranslation: "I LOS saw",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "walking out",
						},
						{
							phrase: "of",
							translation: prep.words.de,
						},
						{
							phrase: "the school",
						},
					],
				},
				{
					id: 6,
					sentence: "The girls saw me going to the beach",
					translation: "LAS girls ME saw going A the beach",
					data: [
						{ phrase: "The", translation: artcl.words.las },
						{ phrase: "girls" },
						{
							phrase: "saw me",
							phraseTranslation: "ME saw",
							translation: pron.dObj.words.me,
							reference: ref("dObjPosition"),
						},
						{
							phrase: "going",
						},
						{
							phrase: "to",
							translation: prep.words.a,
						},
						{
							phrase: "the beach",
						},
					],
				},
				{
					id: 7,
					sentence: "That has been intended for you for a while",
					translation: "ESO has been PARA you POR a while",
					data: [
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "has been",
						},
						{
							phrase: "intended for",
							translation: prep.words.para,
						},
						{
							phrase: "you",
						},
						{
							phrase: "for",
							translation: prep.words.por,
							reference: ref("porFor"),
						},
						{
							phrase: "a while",
						},
					],
				},
				{
					id: 8,
					sentence: "We're the guys you saw yesterday",
					translation: "SOMOS LOS guys QUE you saw yesterday",
					data: [
						{
							phrase: "We're",
							translation: verb.words.ser.present.somos,
							noPronoun: true,
						},
						{
							phrase: "the guys you saw",
							translation: [artcl.words.los, conj.words.que],
							phraseTranslation: "LOS guys QUE you saw",
							reference: ref("queConnector"),
						},
						{
							phrase: "yesterday",
						},
					],
				},
				{
					id: 9,
					sentence: "I knew her, she was better than that",
					translation: "I LA knew, she was better QUE ESO",
					data: [
						{
							phrase: "I knew her",
							translation: pron.dObj.words.la,
							phraseTranslation: "I LA knew",
							reference: ref("dObjPosition"),
						},
						{ phrase: "she was better" },

						{
							phrase: "than",
							translation: conj.words.que,
							reference: { "conj.words.que": [3] },
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
					],
				},
				{
					id: 10,
					sentence: "The thing from the library is my book",
					translation: "The thing DE the library ES my book",
					data: [
						{
							phrase: "The thing",
						},
						{
							phrase: "from",
							translation: prep.words.de,
						},
						{
							phrase: "the library",
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "my book",
						},
					],
				},
				{
					id: 11,
					sentence: "You(F) are the best cook",
					translation: "ERES LA best cook",
					data: [
						{
							phrase: "You(F) are",
							translation: verb.words.ser.present.eres,
							noPronoun: true,
						},
						{
							phrase: "the",
							translation: artcl.words.la,
						},
						{
							phrase: "best cook",
						},
					],
				},
				{
					id: 12,
					sentence: "I think my wine glass is around here",
					translation: "I think QUE my glass DE wine is POR here",
					data: [
						{
							phrase: "I think my wine glass",
							translation: [conj.words.que, prep.words.de],
							phraseTranslation: "I think QUE my glass DE wine",
							reference: ref("queConnector", "deMaterial"),
						},

						{
							phrase: "is around",
							phraseTranslation: "is POR",
							translation: prep.words.por,
							reference: ref("porLocation", "serNoLocation"),
						},
						{
							phrase: "here",
						},
					],
				},
				{
					id: 13,
					sentence: "He and she are a couple",
					translation: "He Y she SON a couple",
					data: [
						{
							phrase: "He",
						},
						{
							phrase: "and",
							translation: conj.words.y,
						},
						{
							phrase: "she",
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
						},
						{
							phrase: "a couple",
						},
					],
				},
				{
					id: 14,
					sentence: "He's here so that you can meet him",
					translation: "He's here PARA QUE you LO can meet",
					data: [
						{
							phrase: "He's here so that",
							phraseTranslation: "He's here PARA QUE",
							translation: [prep.words.para, conj.words.que],
							reference: ref("paraQueConj", "serNoLocation"),
						},
						{
							phrase: "you can meet him",
							phraseTranslation: "you LO can meet",
							translation: pron.dObj.words.lo,
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 15,
					sentence: "Why did he bring them(F)?",
					translation: "POR QUÉ he LAS brought",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							phraseTranslation: "Por que",
							reference: ref("porQueWhy"),
						},
						{
							phrase: "did he bring them",
							translation: pron.dObj.words.las,
							phraseTranslation: "he LAS brought",
							reference: ref("dObjPosition", "noDo"),
						},
					],
				},
				{
					id: 16,
					sentence: "This is the book written by my mentor",
					translation: "This ES the book written POR my mentor",
					data: [
						{
							phrase: "This",
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "the book written",
						},
						{
							phrase: "by",
							translation: prep.words.por,
							reference: ref("porCauseBy"),
						},
						{
							phrase: "my mentor",
						},
					],
				},
				{
					id: 17,
					sentence: "I didn't see you were in line",
					translation: "I NO saw que you were EN line",
					data: [
						{
							phrase: "I",
						},
						{
							phrase: "Didn't see",
							translation: [advrb.words.no, conj.words.que],
							phraseTranslation: "NO saw QUE",
							reference: ref("noDoContractions", "queConnector"),
						},
						{
							phrase: "you were in",
							translation: prep.words.en,
							phraseTranslation: "you were EN",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "line",
						},
					],
				},
				{
					id: 18,
					sentence: "The man has a young daughter",
					translation: "EL man has UNA young daughter",
					data: [
						{
							phrase: "The",
							translation: artcl.words.el,
						},
						{
							phrase: "man has",
						},
						{
							phrase: "a",
							translation: artcl.words.una,
						},
						{
							phrase: "young daughter",
						},
					],
				},
				{
					id: 19,
					sentence: "We need a new butler(M) by this evening",
					translation: "We need UN new butler PARA this evening",
					data: [
						{
							phrase: "We need",
						},
						{
							phrase: "a",
							translation: artcl.words.un,
						},
						{
							phrase: "new butler(M)",
						},
						{
							phrase: "by",
							translation: prep.words.para,
							reference: { "prep.words.para": [2] },
						},
						{
							phrase: "this evening",
						},
					],
				},
				{
					id: 20,
					sentence: "How strange that it was because of the boy",
					translation: "QUÉ strange QUE it was POR EL boy",
					data: [
						{
							phrase: "How strange",
							translation: pron.interrogative.words.que,
							phraseTranslation: "QUE strange",
							reference: { "pron.interrogative.words.que": [0] },
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "it was",
						},
						{
							phrase: "because of",
							translation: prep.words.para,
							reference: { "prep.words.para": [3] },
						},
						{
							phrase: "the boy",
							translation: artcl.words.el,
							phraseTranslation: "EL boy",
						},
					],
				},
				{
					id: 21,
					sentence: "I(M) want to be the best student",
					translation: "I want SER EL best student",
					data: [
						{
							phrase: "I(M) want",
						},
						{
							phrase: "to be",
							translation: verb.words.ser,
						},
						{
							phrase: "the",
							translation: artcl.words.el,
						},
						{
							phrase: "best student",
						},
					],
				},
				{
					id: 22,
					sentence: "That's why they are at the station",
					translation: "POR ESO they are EN the station",
					data: [
						{
							phrase: "That's why",
							translation: [prep.words.por, pron.demonstrative.words.eso],
							phraseTranslation: "POR ESO",
							reference: ref("porEso"),
						},
						{
							phrase: "they are at",
							translation: prep.words.en,
							phraseTranslation: "they are EN",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "the station",
						},
					],
				},
				{
					id: 23,
					sentence: "What do you need?",
					translation: "QUÉ do you need?",
					data: [
						{
							phrase: "What",
							translation: pron.interrogative.words.que,
						},
						{
							phrase: "do",
						},
						{
							phrase: "you need",
						},
					],
				},
				{
					id: 24,
					sentence: "So they(F) are the thieves!",
					translation: "So they(F) are the thieves!",
					data: [
						{
							phrase: "So they(F)",
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
						},
						{
							phrase: "the",
							translation: artcl.words.las,
						},
						{
							phrase: "thieves",
						},
					],
				},
				{
					id: 25,
					sentence: "He isn't the boss, I(M) am the boss ",
					translation: "He NO ES EL boss, I SOY EL boss",
					data: [
						{
							phrase: "He isn't",
							phraseTranslation: "He NO ES",
							translation: [advrb.words.no, verb.words.ser.present.es],
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "the",
							translation: artcl.words.el,
						},
						{
							phrase: "boss",
						},
						{
							phrase: "I am",
							translation: verb.words.ser.present.soy,
							phraseTranslation: "I SOY",
						},
						{
							phrase: "the",
							translation: artcl.words.el,
						},
						{
							phrase: "boss",
						},
					],
				},
			],
			wordBank: [],
		},
		{
			lesson: 16,
			name: "Lesson 16",
			details: "New ways to use SER. SER and Prepositions",
			info: [
				"To give this lesson some context, taks a step back and consider specificaly why you are learning Spanish. \nIs there someone close to you that you want to connect to, or are there specific activities that would be easier, also what specific convsersation topics do you, personall, wish to be able to talk about in fluid spontaneous Spanish?",
				"Go ahead and vividly imagine a conversation you'd like to have in Spanish. Picture who you're talking to, where you are, and what you're talking about. Imagine this conversation being fluid and spontaneous, going in unexpected directions, but imagine that you never get lost! Picture this because our goal is to be there in a few months!",
				"There are some abstract concepts to cover in this lesson, and sometimes this is the most frustrating to get through, especially if you're impatient to start having conversations, but these abstract ideas will be directly applicable to having that conversation you've just imagined",
				"The verb SER is unlike the English TO BE, in that it is VERY specifically used to describe WHAT something IS, or WHO someone IS, as a direct part of their Identity. SER includes the whole family of conjugations we learned in the previous lessons. ES, SON, SOMOS, ERES, SOY, as well as many other forms we haven't learned yet. BUT every form of SER is used in the same way, talking about WHAT something IS",
				"Think about the ways YOU can be described, as a PERSON, or as part of your IDENTITY. What about people or things in your life, what might they be described as 'being', Not as WHERE they are, or HOW they are doing, but as WHAT they are!",
				"This is what SER represents, and it's the key to communicating deeply in Spanish, because it's CORE to how English Linking Verbs are different from Spanish Linking Verbs. If you think about SER/To be in the English sense then you are thinking in English, but start thinking about SER/TO BE as as specific to WHAT something is, or WHO somone IS, then you are starting to think in Spanish!!",
				"So far we've only used SER in the most basic sentences, using straightforwards Nouns or Noun Phrases before and after the form of SER, but it is allowed to follow SER with a preposition in situation where it is directly related to expressing something Identity!",
				"Let's think about how Spanish treats this concept of Identity, consider: 'My mother is/ES from/DE Mexico'. Here SER isn't being followed by a noun but by a preposition and THEN a noun.",
				"Spanish treats 'being from a place' as WHAT you are. If you are FROM New York for example, it's considered part of WHAT YOU ARE. This also applies to a product or food being from a certain place. ",
				"Another Preposition that's used with SER is PARA. For example: 'This gift ES/is PARA/for you' If an Item is intended FOR someone that is considered to be part of it's identity.",
				"Preposition like EN and CON are almost NEVER used after SER, since these two prepositions are almost ALWAYS used to talk about location 'IN/EN the park' or 'WITH/CON my friends'",
				"What about the preposition POR? Is BY or BECAUSE OF associated with SER? Consider the English 'This book is BY that guy'. In English we aren't sure if this is referring to the book being WRITTEN BY the guy, or that the book is NEARY BY the guy. In Spanish using SER makes this a lot more clear, if the book 'ES POR' that guys that clearly means it's written by him and not referring to location! Because of function in the same manner.",
				"Another part of Spanish Identity is physical characteristics, such as 'how tall' would use SER because that is part of someones identity. ",
			],
			sentences: [
				{
					id: 1,
					sentence: "This gift is for you",
					translation: "This gift ES PARA you",
					data: [
						{
							phrase: "This gift",
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: { "verb.words.ser": [2] },
						},
						{
							phrase: "for",
							translation: prep.words.para,
							reference: { "prep.words.para": [0] },
						},
						{
							phrase: "you",
						},
					],
				},
				{
					id: 2,
					sentence: "That is because of our party",
					translation: "ESO ES POR our party",
					data: [
						{
							phrase: "That",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "is because of",
							translation: [verb.words.ser.present.es, prep.words.por],
							reference: ref("porBecauseOf"),
							phraseTranslation: "ES POR",
						},
						{
							phrase: "our party",
						},
					],
				},
				{
					id: 3,
					sentence: "He is tall but we are short",
					translation: "He ES tall but we SOMOS short",
					data: [
						{
							phrase: "He is",
							translation: verb.words.ser.present.es,
							phraseTranslation: "He ES",
							reference: { "verb.words.ser": [2] },
						},
						{
							phrase: "tall, but",
						},
						{
							phrase: "we are",
							translation: verb.words.ser.present.somos,
							phraseTranslation: "we SOMOS",
						},
						{
							phrase: "short",
						},
					],
				},
				{
					id: 4,
					sentence: "They are from this town?",
					translation: "SON DE this town?",
					data: [
						{
							phrase: "They are from",
							translation: verb.words.ser.present.son,
							reference: { "verb.words.ser": [1] },
							phraseTranslation: "SON DE",
							noPronoun: true,
						},
						{
							phrase: "this town",
						},
					],
				},
				{
					id: 5,
					sentence: "That is with the pencil on the table",
					translation: "ESO is CON the pencil EN the table",
					data: [
						{
							phrase: "That is with",
							translation: [pron.demonstrative.words.eso, prep.words.con],
							phraseTranslation: "ESO is CON",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "the pencil",
						},
						{
							phrase: "on",
							translation: prep.words.en,
						},
						{
							phrase: "the table",
						},
					],
				},
				{
					id: 6,
					sentence: "The food is for the girls.",
					translation: "The food ES PARA LAS girls",
					data: [
						{
							phrase: "The food",
						},
						{
							phrase: "is for",
							translation: [verb.words.ser.present.es, prep.words.para],
							reference: { "verb.words.ser": [2], "prep.words.para": [0] },
							phraseTranslation: "ES PARA",
						},
						{
							phrase: "the girls",
							translation: artcl.words.las,
							phraseTranslation: "LAS girls",
						},
					],
				},
				{
					id: 7,
					sentence: "She wants to be a firefighter",
					translation: "She wants SER a firefighter",
					data: [
						{
							phrase: "She wants",
						},
						{
							phrase: "to be",
							translation: verb.words.ser,
						},
						{
							phrase: "a firefighter",
						},
					],
				},
				{
					id: 8,
					sentence: "It's the afternoon",
					translation: "ES the afternoon",
					data: [
						{
							phrase: "It's",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "the afternoon",
						},
					],
				},
				{
					id: 9,
					sentence: "They are near the park",
					translation: "They are POR the park",
					data: [
						{
							phrase: "They are near",
							phraseTranslation: "They are POR",
							translation: prep.words.por,
							reference: ref("serNoLocation", "porLocation"),
						},
						{
							phrase: "the park",
						},
					],
				},
				{
					id: 10,
					sentence: "I(M) am the queen's cousin",
					translation: "SOY EL cousin DE LA queen",
					data: [
						{
							phrase: "I am",
							translation: verb.words.ser.present.soy,
							noPronoun: true,
						},
						{
							phrase: "the queen's cousin",
							translation: [artcl.words.el, prep.words.de, artcl.words.la],
							phraseTranslation: "EL cousin DE LA queen",
							reference: ref("dePossessionContractions"),
						},
					],
				},
				{
					id: 11,
					sentence: "The man is driving along the highway",
					translation: "EL man is driving POR the highway",
					data: [
						{
							phrase: "The man is driving",
							translation: artcl.words.el,
							phraseTranslation: "EL man is driving",
							reference: ref("serNoDoing"),
						},
						{
							phrase: "along",
							translation: prep.words.por,
							reference: ref("porAlong"),
						},
						{
							phrase: "the highway",
						},
					],
				},
				{
					id: 12,
					sentence: "The car is for the man",
					translation: "The car ES PARA EL man",
					data: [
						{
							phrase: "The car",
						},
						{
							phrase: "is for",
							translation: [verb.words.ser.present.es, prep.words.para],
							reference: { "verb.words.ser": [2], "prep.words.para": [0] },
							phraseTranslation: "ES PARA",
						},
						{
							phrase: "the man",
							translation: artcl.words.el,
							phraseTranslation: "EL man",
						},
					],
				},
				{
					id: 13,
					sentence: "That is because of my mistake",
					translation: "ESO ES POR my mistake",
					data: [
						{
							phrase: "That is becaue of",
							translation: [
								pron.demonstrative.words.eso,
								verb.words.ser.present.es,
								prep.words.por,
							],
							reference: ref("serIdentity", "porBecauseOf"),
							phraseTranslation: "ESO ES POR",
						},
						{
							phrase: "my mistake",
						},
					],
				},
				{
					id: 14,
					sentence: "You're not from Argentina",
					translation: "NO ERES DE Argentina",
					noPronoun: true,
					data: [
						{
							phrase: "You're not from",
							translation: [
								advrb.words.no,
								verb.words.ser.present.eres,
								prep.words.de,
							],
							reference: { "verb.words.ser": [1], "advrb.words.no": [6] },
							phraseTranslation: "NO ERES DE",
							noPronoun: true,
						},
						{
							phrase: "Argentina",
						},
					],
				},
				{
					id: 15,
					sentence: "It's a cheap toy, that's why it's of plastic",
					translation: "ES a cheap toy, POR ESO ES DE plastic",
					noPronoun: true,
					data: [
						{
							phrase: "It's",
							translation: verb.words.ser.present.es,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "a cheap toy",
						},
						{
							phrase: "that's why",
							translation: [pron.demonstrative.words.eso, prep.words.por],
							phraseTranslation: "POR ESO",
							reference: ref("porEso"),
						},
						{
							phrase: "it's",
							translation: verb.words.ser.present.es,
						},
						{
							phrase: "of plastic",
							translation: prep.words.de,
							phraseTranslation: "DE plastic",
						},
					],
				},
				{
					id: 16,
					sentence: "That is for you!",
					translation: "ESO ES PARA you!",
					data: [
						{
							phrase: "That is for",
							phraseTranslation: "ESO ES PARA",
							translation: [
								pron.demonstrative.words.eso,
								verb.words.ser.present.es,
								prep.words.para,
							],
							reference: ref("serIdentity", "paraFor", "porFor"),
						},
						{
							phrase: "you",
						},
					],
				},
				{
					id: 17,
					sentence: "These books are by my favorite author.",
					translation: "These books SON POR my favorite author.",
					data: [
						{
							phrase: "These books",
						},
						{
							phrase: "are by",
							translation: [verb.words.ser.present.son, prep.words.por],
							phraseTranslation: "SON POR",
							reference: ref("serIdentity", "porCauseBy"),
						},
						{
							phrase: "my favorite author",
						},
					],
				},
				{
					id: 18,
					sentence: "I am telling her he is at home",
					translation: "I am telling her QUE he is EN home",
					data: [
						{
							phrase: "I am telling her he is",
							translation: conj.words.que,
							phraseTranslation: "I am telling her QUE he is",
							reference: ref("queConnector", "serNoDoing"),
						},
						{
							phrase: "at home",
							phraseTranslation: "EN home",
							translation: prep.words.en,
						},
					],
				},
				{
					id: 19,
					sentence: "They aren't from Chile, WE are from Chile!",
					translation: "They NO SON DE Chile, WE SOMOE DE CHile!",
					data: [
						{
							phrase: "They aren't from",
							phraseTranslation: "They NO SON DE",
							translation: [
								verb.words.ser.present.son,
								prep.words.de,
								advrb.words.no,
							],
							reference: ref("serOrigin", "noContractions"),
						},
						{
							phrase: "Chile,",
						},
						{
							phrase: "we are from",
							phraseTranslation: "WE SOMOS DE",
							translation: [verb.words.ser.present.somos, prep.words.de],
							reference: ref("serOrigin"),
						},
						{
							phrase: "Chile!",
						},
					],
				},
				{
					id: 20,
					sentence: "It's the lady's",
					translation: "ES DE LA Lady",
					noPronoun: true,
					data: [
						{
							phrase: "It's",
							translation: verb.words.ser.present.es,
							reference: { "verb.words.ser": [1] },
							noPronoun: true,
						},
						{
							phrase: "the lady's",
							translation: [prep.words.de, artcl.words.la],
							phraseTranslation: "DE LA Lady",
							reference: ref("dePossessionContractions"),
						},
					],
				},
				{
					id: 21,
					sentence: "The girls are by the lady's car over there",
					translation: "LAS girls are POR the car DE LA lady over there",
					data: [
						{
							phrase: "The girls are by",
							translation: [artcl.words.las, prep.words.para],
							phraseTranslation: "LAS girls are POR",
							reference: ref("serNoLocation", "porLocation"),
						},
						{
							phrase: "the lady's car",
							translation: [prep.words.de, artcl.words.la],
							phraseTranslation: "the car DE LA lady",
							reference: ref("dePossessionContractions"),
						},
						{
							phrase: "over there",
						},
					],
				},
				{
					id: 22,
					sentence: "I am at the party",
					translation: "I am EN the party",
					data: [
						{
							phrase: "I am at",
							translation: prep.words.en,
							phraseTranslation: "I am EN",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "the party",
						},
					],
				},
				{
					id: 23,
					sentence: "HE isn't Jose's son!",
					translation: "HE NO ES EL son DE Jose!",
					data: [
						{
							phrase: "HE isn't",
							phraseTranslation: "HE NO ES",
							translation: [verb.words.ser.present.es, advrb.words.no],
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "Jose's son",
							translation: [artcl.words.el, prep.words.de],
							phraseTranslation: "EL son DE Jose",
							reference: ref("dePossessionContractions"),
						},
					],
				},
				{
					id: 24,
					sentence: "They are with the lady at 3:00 every day.",
					translation: "They are CON LA lady A 3:00 every day.",
					data: [
						{
							phrase: "They are with",
							phraseTranslation: "They are CON",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "the lady",
							phraseTranslation: "LA lady",
							translation: artcl.words.la,
						},
						{
							phrase: "at 3:00",
							phraseTranslation: "A 3:00",
							translation: prep.words.a,
							reference: { "prep.words.a": [0] },
						},
					],
				},
				{
					id: 25,
					sentence: "It is staying in the car for a while",
					translation: "It is staying EN the car POR a while",
					data: [
						{
							phrase: "It is staying in",
							phraseTranslation: "It is staying EN",
							translation: prep.words.en,
							reference: ref("serNoDoing"),
						},
						{
							phrase: "the car",
						},
						{
							phrase: "for",
							translation: prep.words.por,
							reference: ref("porFor"),
						},
						{
							phrase: "a while",
						},
					],
				},
			],
			wordBank: [],
		},
		{
			lesson: 17,
			name: "Lesson 17",
			details: "Subject Pronouns: I, YOU, HE, SHE, WE, THEY",
			info: [
				"We learned in Lesson 14 that Subject pronouns are often omitted in Spanish because the verb conjugation already indicates who the subject is.",
				" However, subject pronouns are used in certain situations, such as for emphasis or clarity.",
				"Subject Pronouns HE, SHE, WE, I, YOU, and THEY",
				"I = YO",
				"HE = ÉL",
				"SHE = ELLA",
				"WE (M) = NOSOTROS, (F) = NOSOTRAS",
				"THEY (M) = ELLOS, (F) = ELLAS",
				"In this quiz I will let you know if the Subject Pronoun can be omitted, otherwise use it!",
			],
			wordBank: [
				pron.subject.words.yo,
				pron.subject.words.el,
				pron.subject.words.ella,
				pron.subject.words.nosotros,
				pron.subject.words.nosotras,
				pron.subject.words.ellos,
				pron.subject.words.ellas,
			],
			sentences: [
				{
					id: 1,
					sentence: "He and she",
					translation: "ÉL Y ELLA",
					data: [
						{
							phrase: "He",
							translation: pron.subject.words.el,
						},
						{
							phrase: "and",
							translation: conj.words.y,
						},
						{
							phrase: "she",
							translation: pron.subject.words.ella,
						},
					],
				},
				{
					id: 2,
					sentence: "You and I are from Columbia",
					translation: "TÚ Y YO SOMOS DE Columbia",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.tu,
						},
						{
							phrase: "and",
							translation: conj.words.y,
						},
						{
							phrase: "I",
							translation: pron.subject.words.yo,
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.somos,
							reference: ref("serOrigin"),
						},
						{
							phrase: "from",
							translation: prep.words.de,
						},
						{
							phrase: "Columbia",
						},
					],
				},
				{
					id: 3,
					sentence: "They (M) are my friends",
					translation: "ELLOS SON my friends",
					data: [
						{
							phrase: "They (M)",
							translation: pron.subject.words.ellos,
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
						},
						{
							phrase: "my friends",
						},
					],
				},
				{
					id: 4,
					sentence: "You and we are here now",
					translation: "TÚ Y NOSOTROS are here now",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.tu,
						},
						{
							phrase: "and",
							translation: conj.words.y,
						},
						{
							phrase: "we are",
							translation: pron.subject.words.nosotros,
							phraseTranslation: "NOSOTROS are",
							reference: { "verb.words.ser": [5] },
						},
						{
							phrase: "here now",
						},
					],
				},
				{
					id: 5,
					sentence: "She is my friend",
					translation: "ELLA es my friend",
					data: [
						{
							phrase: "She",
							translation: pron.subject.words.ella,
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: { "verb.words.ser": [7] },
						},
						{
							phrase: "my friend",
						},
					],
				},
				{
					id: 6,
					sentence: "The dog sees you",
					translation: "The dog TE sees",
					data: [
						{
							phrase: "The dog",
						},
						{
							phrase: "sees you",
							translation: pron.dObj.words.te,
							phraseTranslation: "TE sees",
							reference: { "pron.dObj": [1] },
						},
					],
				},
				{
					id: 7,
					sentence: "He sees me",
					translation: "ÉL ME sees",
					data: [
						{
							phrase: "He",
							translation: pron.subject.words.el,
						},
						{
							phrase: "sees me",
							translation: pron.dObj.words.me,
							phraseTranslation: "ME sees",
							reference: { "pron.dObj": [1] },
						},
					],
				},
				{
					id: 8,
					sentence: "You know her",
					translation: "TÚ LA know",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.tu,
						},
						{
							phrase: "know her",
							translation: pron.dObj.words.la,
							phraseTranslation: "LA know",
							reference: { "pron.dObj": [1] },
						},
					],
				},
				{
					id: 9,
					sentence: "I see you",
					translation: "YO TE see",
					data: [
						{
							phrase: "I",
							translation: pron.subject.words.yo,
						},
						{
							phrase: "see you",
							translation: pron.dObj.words.te,
							phraseTranslation: "TE see",
							reference: { "pron.dObj": [1] },
						},
					],
				},
				{
					id: 10,
					sentence: "She knows him",
					translation: "ELLA LO knows",
					data: [
						{
							phrase: "She",
							translation: pron.subject.words.ella,
						},
						{
							phrase: "knows him",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO knows",
							reference: { "pron.dObj": [1] },
						},
					],
				},
				{
					id: 11,
					sentence: "What are they(M)",
					translation: "QUÉ SON ELLOS,",
					data: [
						{
							phrase: "What",
							translation: pron.interrogative.words.que,
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
							reference: { "verb.words.ser": [7] },
						},
						{
							phrase: "they (M)",
							translation: pron.subject.words.ellos,
						},
					],
				},
				{
					id: 12,
					sentence: "That is because of the girls",
					translation: "ESO ES POR LAS girls",
					data: [
						{
							phrase: "That",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: { "verb.words.ser": [7] },
						},
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: { "prep.words.por": [3] },
						},
						{
							phrase: "the",
							translation: artcl.words.las,
						},
						{
							phrase: "girls",
						},
					],
				},
				{
					id: 13,
					sentence: "They (M) did it, but she didn't do it",
					translation: "ELLOS LO did, but ELLA NO LO did",
					data: [
						{
							phrase: "They (M)",
							translation: pron.subject.words.ellos,
						},
						{
							phrase: "did it",
							translation: pron.dObj.words.lo,
							phraseTranslation: "LO did",
							reference: { "pron.dObj": [1] },
						},
						{
							phrase: "but",
						},
						{
							phrase: "she",
							translation: pron.subject.words.ella,
						},
						{
							phrase: "didn't do it",
							translation: [advrb.words.no, pron.dObj.words.lo],
							phraseTranslation: "NO LO did",
							reference: { "pron.dObj": [1], "advrb.words.no": [6] },
						},
					],
				},
				{
					id: 14,
					sentence: "I'm not that, he is that",
					translation: "YO NO SOY ESO, ÉL ES ESO",
					data: [
						{
							phrase: "I'm not",
							translation: [
								pron.subject.words.yo,
								advrb.words.no,
								verb.words.ser.present.soy,
							],
							phraseTranslation: "YO NO SOY",
							reference: { "advrb.words.no": [6] },
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "he",
							translation: pron.subject.words.el,
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: { "verb.words.ser": [7] },
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
					],
				},
				{
					id: 15,
					sentence: "I think even she knows them (M)",
					translation: "YO think QUE even ELLA LOS knows",
					data: [
						{
							phrase: "I think",
							phraseTranslation: "YO think QUE",
							translation: [pron.subject.words.yo, conj.words.que],
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "even",
						},
						{
							phrase: "she",
							translation: pron.subject.words.ella,
						},
						{
							phrase: "knows them (M)",
							translation: pron.dObj.words.los,
							phraseTranslation: "LOS knows",
							reference: { "pron.dObj": [1] },
						},
					],
				},
				{
					id: 16,
					sentence: "Why are they (F) your friends?",
					translation: "POR QUÉ SON ELLAS your friends?",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							phraseTranslation: "POR QUÉ",
							reference: { "prep.words.por": [10] },
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
							reference: { "verb.words.ser": [7] },
						},
						{
							phrase: "they (F)",
							translation: pron.subject.words.ellas,
						},
						{
							phrase: "your friends",
						},
					],
				},
				{
					id: 17,
					sentence: "They (F) can see them (F), but you can't see them (F)?",
					translation: "ELLAS LAS can see, but TÚ NO LAS can see?",
					data: [
						{
							phrase: "They (F)",
							translation: pron.subject.words.ellas,
						},
						{
							phrase: "can see them (F)",
							translation: pron.dObj.words.las,
							phraseTranslation: "LAS can see",
							reference: { "pron.dObj": [1] },
						},
						{
							phrase: "but",
						},
						{
							phrase: "you",
							translation: pron.subject.words.tu,
						},
						{
							phrase: "can't see them (F)",
							translation: [advrb.words.no, pron.dObj.words.las],
							phraseTranslation: "NO LAS can see",
							reference: { "pron.dObj": [1], "advrb.words.no": [6] },
						},
					],
				},
				{
					id: 18,
					sentence: "They are by my favorite author",
					translation: "SON POR my favorite author",
					data: [
						{
							phrase: "They are (NO SUBJECT PRONOUN)",
							translation: verb.words.ser.present.son,
							reference: { "verb.words.ser": [7] },
						},
						{
							phrase: "by",
							translation: prep.words.por,
						},
						{
							phrase: "my favorite author",
						},
					],
				},
				{
					id: 19,
					sentence: "We (M) aren't eating that",
					translation: "NOSOTROS NO are eating ESO",
					data: [
						{
							phrase: "We (M)",
							translation: pron.subject.words.nosotros,
						},
						{
							phrase: "aren't eating",
							translation: advrb.words.no,
							phraseTranslation: "NO are eating",
							reference: {
								"advrb.words.no": [6],
								"verb.words.ser.present": [6],
							},
						},
						{
							phrase: "that",
							translation: pron.demonstrative.words.eso,
						},
					],
				},
				{
					id: 20,
					sentence: "What are you for her family?",
					translation: "QUÉ ERES TÚ PARA her family?",
					data: [
						{
							phrase: "What",
							translation: pron.interrogative.words.que,
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.eres,
							reference: { "verb.words.ser": [7] },
						},
						{
							phrase: "you",
							translation: pron.subject.words.tu,
						},
						{
							phrase: "for",
							translation: prep.words.para,
							reference: { "prep.words.para": [0] },
						},
						{ phrase: "her family" },
					],
				},
				{
					id: 21,
					sentence: "He is much taller than we(F)",
					translation: "ÉL ES much taller QUE NOSOTRAS",
					data: [
						{
							phrase: "He",
							translation: pron.subject.words.el,
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: { "verb.words.ser": [4] },
						},
						{
							phrase: "much taller",
						},
						{
							phrase: "than",
							translation: prep.words.que,
							reference: { "prep.words.que": [3] },
						},
						{
							phrase: "we (F)",
							translation: pron.subject.words.nosotras,
						},
					],
				},
				{
					id: 22,
					sentence: "Where are you from?",
					translation: "DE where ERES",
					data: [
						{
							phrase: "Where are you from? (NO SUBJECT PRONOUN)",
							translation: [prep.words.de, verb.words.ser.present.eres],
							phraseTranslation: "DE where ERES",
							reference: { prep: [2], "verb.words.ser": [1] },
						},
					],
				},
				{
					id: 23,
					sentence: "No they (M) aren't the winners",
					translation: "NO, ELLOS NO SON LOS winners",
					data: [
						{
							phrase: "No",
							translation: advrb.words.no,
						},
						{
							phrase: "they (M)",
							translation: pron.subject.words.ellos,
						},
						{
							phrase: "aren't",
							translation: advrb.words.no,
							phraseTranslation: "NO SON",
						},
						{
							phrase: "the winners",
							translation: [artcl.words.los],
							phraseTranslation: "LOS winners",
						},
					],
				},
				{
					id: 24,
					sentence: "I think that she is around here",
					translation: "I think QUE ELLA is POR here",
					data: [
						{
							phrase: "I think",
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "she",
							translation: pron.subject.words.ella,
						},
						{
							phrase: "is around",
							translation: prep.words.por,
							phraseTranslation: "is POR",
							reference: { "prep.words.por": [5], "verb.words.ser": [5] },
						},
						{
							phrase: "here",
						},
					],
				},
			],
		},
		{
			lesson: 18,
			name: "Lesson 18",
			details: "SER, Past tense conjugations",
			info: [
				"In this lesson we will learn the past tense conjugations of the verb SER, which is used to describe identity, origin, time, and other permanent characteristics.",
				"The past tense conjugations of SER allow us to say things like 'I was', 'you were', 'he/she was', 'we were', and 'they were'.",
				"Learning all these conjugations can be tricky, we recommend a three step process to learning Verb conjugations:",
				"1. Make sure you've vividly memorizerd all the individual words, and aren't confusing them",
				"2. Use these conjugations in rendomized sentence contexts, like in this quiz",
				"3. Get so fast at recalling the correct conjugations that it becomes second nature",
				"This quiz will have a lot of short drills on both tenses of SER to start, then will get into fuller sentences, (THIS may be split into different excersises in the future..",
			],
			wordBank: [
				verb.words.ser.past.era,
				verb.words.ser.past.eras,
				verb.words.ser.past.eran,
				verb.words.ser.past.eramos,
				noun.words.amigo,
				noun.words.amiga,
				noun.words.chico,
				noun.words.chica,
			],
			sentences: [
				{
					id: 1,
					sentence: "They are",
					translation: "SON",
					data: [
						{
							phrase: "They are",
							translation: verb.words.ser.present.son,
							noPronoun: true,
						},
					],
				},
				{
					id: 2,
					sentence: "You were",
					translation: "ERAS",
					data: [
						{
							phrase: "You were",
							translation: verb.words.ser.past.eras,
							noPronoun: true,
						},
					],
				},
				{
					id: 3,
					sentence: "You are",
					translation: "ERES",
					data: [
						{
							phrase: "You are",
							translation: verb.words.ser.present.eres,
							noPronoun: true,
						},
					],
				},
				{
					id: 4,
					sentence: "I am",
					translation: "SOY",
					data: [
						{
							phrase: "I am",
							translation: verb.words.ser.present.soy,
							noPronoun: true,
						},
					],
				},
				{
					id: 5,
					sentence: "We were",
					translation: "ÉRAMOS",
					data: [
						{
							phrase: "We were",
							translation: verb.words.ser.past.eramos,
							noPronoun: true,
						},
					],
				},
				{
					id: 6,
					sentence: "We are",
					translation: "SOMOS",
					data: [
						{
							phrase: "We are",
							translation: verb.words.ser.present.somos,
							noPronoun: true,
						},
					],
				},
				{
					id: 7,
					sentence: "I was",
					translation: "ERA",
					data: [
						{
							phrase: "I was",
							translation: verb.words.ser.past.era,
							noPronoun: true,
						},
					],
				},
				{
					id: 8,
					sentence: "They were",
					translation: "ERAN",
					data: [
						{
							phrase: "They were",
							translation: verb.words.ser.past.eran,
							noPronoun: true,
						},
					],
				},
				{
					id: 9,
					sentence: "He was",
					translation: "ERA",
					data: [
						{
							phrase: "He was",
							translation: verb.words.ser.past.era,
							noPronoun: true,
						},
					],
				},
				{
					id: 10,
					sentence: "He is",
					translation: "ES",
					data: [
						{
							phrase: "He is",
							translation: verb.words.ser.present.es,
							noPronoun: true,
						},
					],
				},
				{
					id: 11,
					sentence: "He and they were friends",
					translation: "ÉL Y ELLOS ERAN AMIGOS",
					data: [
						{
							phrase: "He and they",
							translation: [
								pron.subject.words.el,
								conj.words.y,
								pron.subject.words.ellos,
							],
						},
						{
							phrase: "were friends",
							translation: [verb.words.ser.past.eran, noun.words.amigos],
						},
					],
				},
				{
					id: 12,
					sentence: "The guys were friends",
					translation: "LOS CHICOS ERAN AMIGOS",
					data: [
						{
							phrase: "The guys",
							translation: [artcl.words.los, noun.words.chicos],
						},
						{
							phrase: "were friends",
							translation: [verb.words.ser.past.eran, noun.words.amigos],
						},
					],
				},
				{
					id: 13,
					sentence: "She and I(F) are friends",
					translation: "ELLA Y YO SOMOS AMIGAS",
					data: [
						{
							phrase: "She and I(F)",
							translation: [
								pron.subject.words.ella,
								conj.words.y,
								pron.subject.words.yo,
							],
						},
						{
							phrase: "are friends",
							translation: [verb.words.ser.present.somos, noun.words.amigas],
						},
					],
				},
				{
					id: 14,
					sentence: "You were the girl?",
					translation: "ERAS LA CHICA?",
					data: [
						{
							phrase: "You were",
							translation: verb.words.ser.past.eras,
							noPronoun: true,
						},
						{
							phrase: "the girl?",
							translation: [
								verb.words.ser.past.eras,
								artcl.words.la,
								noun.words.chica,
							],
						},
					],
				},
				{
					id: 15,
					sentence: "I said that he is the guy",
					translation: "I said QUE ES EL CHICO",
					data: [
						{
							phrase: "I said",
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{
							phrase: "he is",
							translation: verb.words.ser.present.es,
							noPronoun: true,
						},
						{
							phrase: "the guy",
							translation: [artcl.words.el, noun.words.chico],
						},
					],
				},
				{
					id: 16,
					sentence: "We(M) were very good friends",
					translation: "NOSOTROS ÉRAMOS very good AMIGOS",
					data: [
						{
							phrase: "We(M) were",
							translation: [
								pron.subject.words.nosotros,
								verb.words.ser.past.eramos,
							],
						},
						{
							phrase: "very good",
						},
						{
							phrase: "friends",
							translation: noun.words.amigos,
						},
					],
				},
				{
					id: 17,
					sentence: "What are they(F)",
					translation: "QUÉ SON ELLAS",
					data: [
						{
							phrase: "What",
							translation: pron.interrogative.words.que,
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
						},
						{
							phrase: "they(F)",
							translation: pron.subject.words.ellas,
						},
					],
				},
				{
					id: 18,
					sentence: "She was the friend, they(F) weren't the friends(F)",
					translation: "ELLA ERA LA AMIGA, ELLAS NO ERAN LAS AMIGAS",
					data: [
						{
							phrase: "She was the friend,",
							translation: [
								pron.subject.words.ella,
								verb.words.ser.past.era,
								artcl.words.la,
								noun.words.amiga,
							],
						},
						{
							phrase: "they(F) weren't the friends(F)",
							translation: [
								pron.subject.words.ellas,
								advrb.words.no,
								verb.words.ser.past.eran,
								artcl.words.las,
								noun.words.amigas,
							],
							reference: { "advrb.words.no": [6] },
						},
					],
				},
				{
					id: 19,
					sentence: "I was her student",
					translation: "YO ERA her student",
					data: [
						{
							phrase: "I was",
							translation: [pron.subject.words.yo, verb.words.ser.past.era],
						},
						{
							phrase: "her student",
						},
					],
				},
				{
					id: 20,
					sentence: "You weren't the tallest(M), I was the tallest(M)",
					translation: "TÚ NO ERAS EL tallest, YO ERA EL tallest",
					data: [
						{ phrase: "You", translation: pron.subject.words.tu },
						{
							phrase: "weren't",
							translation: [advrb.words.no, verb.words.ser.past.eras],
						},
						{
							phrase: "the tallest(M)",
							translation: [artcl.words.el],
							phraseTranslation: "EL tallest",
						},
					],
				},
				{
					id: 21,
					sentence: "You're my teacher so that I can learn algebra",
					translation: "ERES my teacher PARA QUE I can learn algebra",
					data: [
						{
							phrase: "You're",
							translation: verb.words.ser.present.eres,
							noPronoun: true,
						},
						{ phrase: "my teacher" },
						{
							phrase: "so that",
							translation: [prep.words.para, conj.words.que],
							reference: { "prep.words.para": [5] },
						},
						{ phrase: "I can learn algebra" },
					],
				},
				{
					id: 22,
					sentence: "If he was the owner, why was she here?",
					translation: "If ÉL ERA EL owner, POR QUÉ was ELLA here?",
					data: [
						{ phrase: "If" },
						{
							phrase: "he was",
							translation: [pron.subject.words.el, verb.words.ser.past.era],
						},
						{
							phrase: "the owner",
							translation: [artcl.words.el],
							phraseTranslation: "EL owner",
						},
						{
							phrase: "why",
							translation: [prep.words.por, pron.interrogative.words.que],
							phraseTranslation: "POR QUÉ",
							reference: { "prep.words.por": [10] },
						},
						{
							phrase: "was she",
							translation: [pron.subject.words.ella],
							phraseTranslation: "was ELLA",
							reference: { "verb.words.ser": [5] },
						},
						{ phrase: "here" },
					],
				},
				{
					id: 23,
					sentence: "That was strange.",
					translation: "ESO ERA strange.",
					data: [
						{
							phrase: "That",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
						},
						{
							phrase: "strange",
						},
					],
				},
				{
					id: 24,
					sentence: "He is the boss? I thought we(F) were the bosses(F)",
					translation:
						"ÉL ES EL boss? YO thought QUE NOSOTRAS ÉRAMOS LAS bosses",
					data: [
						{
							phrase: "He is the boss?",
							translation: [
								pron.subject.words.el,
								verb.words.ser.present.es,
								artcl.words.el,
							],
							phraseTranslation: "ÉL ES EL boss?",
						},
						{
							phrase: "I thought we(f) were",
							translation: [
								pron.subject.words.yo,
								conj.words.que,
								pron.subject.words.nosotras,
								verb.words.ser.past.eramos,
							],
							phraseTranslation: "YO thought QUE NOSOTRAS ÉRAMOS",
							reference: { "conj.words.que": [1] },
						},
						{
							phrase: "the bosses(F)",
							translation: [artcl.words.las],
							phraseTranslation: "LAS bosses",
						},
					],
				},
				{
					id: 25,
					sentence: "I'm your friend(M), right?",
					translation: "SOY your AMIGO, right?",
					data: [
						{
							phrase: "I'm",
							translation: verb.words.ser.present.soy,
							noPronoun: true,
						},
						{ phrase: "your" },
						{ phrase: "friend(M)", translation: noun.words.amigo },
						{ phrase: "right?" },
					],
				},
				{
					id: 26,
					sentence: "You were my favorite teacher",
					translation: "TÚ ERAS my favorite teacher",
					data: [
						{
							phrase: "You were",
							translation: [pron.subject.words.tu, verb.words.ser.past.eras],
						},
						{ phrase: "my favorite teacher" },
					],
				},
				{
					id: 27,
					sentence: "We were friends(M) and he and she were enemies",
					translation: "ÉRAMOS AMIGOS, Y ÉL Y ELLA ERAN enemies",
					data: [
						{
							phrase: "We were friends(M)",
							translation: [verb.words.ser.past.eramos, noun.words.amigos],
						},
						{ phrase: "and", translation: conj.words.y },
						{
							phrase: "he and she",
							translation: [
								pron.subject.words.el,
								conj.words.y,
								pron.subject.words.ella,
							],
						},
						{
							phrase: "were",
							translation: [verb.words.ser.past.eran],
						},
						{ phrase: "enemies" },
					],
				},
			],
		},
		{
			//this lesson probably needs to be split up or formatted differently it's very long and covers a lot.
			lesson: 19,
			name: "Lesson 19",
			details: "SER: Advanced usage as a linking verb",
			info: [
				"In a perfect Spanish conversation with a native speaker, you're going to spend a lot of time talking about WHAT something is, or WHO someone is, and that's SER's job!",
				"So far we've used SER to link two parts of a sentence, having some kind of NOUN before and after the SER conjugation, sometimes using prepositions such as DE, POR, and PARA, when they can indicate WHAT something is.",
				"Examples include: 'That was that' = 'Eso ERA Eso', or 'The guy was from Argentina' = 'El chico ERA DE Argentina'.",
				"BUT what about a sentence like this: 'The problem is that he wants even more' so where does SER fit in here?",
				" We have the word IS, and in this case the word 'THAT' follows it. BUT this isn't a case of That=ESO, this is an example of a QUE phrase: 'The problem is QUE he wants even more'",
				"We learned back in Lesson 11 that QUE phrases can be treated as one big noun, which is what's happening here: 'That he wants even more' is being treated as a noun",
				"It's kind of like saying 'The problem is (The fact that he wants even more)'",
				"So this passes the 'What it is' test, since we have 'The problem' on one side, and 'That he wants even more' on the other side, and we are equating them with on another",
				"Since it's WHAT something is, we can safely use SER or it's conjugation ES here: 'The problem ES QUE ÉL wants even more'",
				"In fact, you will often see a QUE phrase right after a conjugation of SER, even if we are talking about Abstract Ideas, we are still describing WHAT THEY ARE, and that's SER's job!",
				"Now, is it possible for a linking verb like SER to NOT go between the two things being linked? Consider this sentence: 'Is your dog a good boy?'",
				"In English, when we phrase this as a question suddenly the linking verb IS goes to the front of the sentence, and the nouns get paired up next to each other.",
				"In some cases we can do the same thing in Spanish. We could actually translate that sentence in TWO DIFFERENT ways! 'Your dog ES UN good CHICO?' OR 'ES your dog UN good CHICO'",
				"This particularly happens in Spanish when we ask more complex 'Why' questions, like: 'Why is she your friend?' We are still using is/SER to equate two things, (She and Your Friend).",
				"BUT we would never ask is like: 'Why she is your friend?', instead it's phrased as: 'Why is... she... your friend?' with the two things being equated NEXT to each other, and is/SER or our equals sign, coming before both of them",
				"SO even though SER is the linking verb in many questions, the link between the two parts happens before both parts are even named",
				"Another question, is it possible to END a sentence with SER? We do it all the time in English: 'They aren't my friends, but he is', this is basically 'They aren't my friends, but he is my friend' but we leave off the last phrase since it's clearly implied.",
				"The thing is, in Spanish, you CANNOT do this!, you can't use a linking verb like SER without attaching SOMETHING to it, BUT that doesn't mean we have to use all those extra words.",
				"Spanish uses a different kind of shortcut in this case: 'They aren't my friends, but he is it', this sounds strange in English, but it occurs ALL THE TIME in Spanish",
				"We specifically use the word LO in these situations, the same structure as if it was the direct object pronoun, and LO/it, represents 'all that stuff I mentioned earlier'.",
				"This form of LO is actually an 'Attribute' a technical term meaning it's not referring to a person, but rather to 'all that stuff mentioned earlier in the sentence', very simillar to uses of ESO we've explored already",
				"Now this may seem like the sentence needs to end in LO, since we need to attach something to SER at the end of a sentence, but LO still follows the Direct Obj placement rules here, and is placed BEFORE the linking verb",
				"'They aren't my friends, but he is it' = 'Ellos no son my amigos, but Él LO es'",
				"This seems eccentric and obscure to English speakers but it's perfectly natural in Spanish, so don't worry if it takes some time getting used to! Anytime you would end with a form or 'to be' in English, you put LO before it in Spanish!",
				"This concept always uses the word LO even if the concept we are referring to is feminied/pluralized or any other variation: 'He's a friend, she isn't' = 'Él es un amigo, ella no LO es'",
				"One last concept to cover here: consider the sentence: 'To be a student is a fun thing' = 'SER a student ES a fun thing'. This is an odd sentence in English, we would more commonly say 'BEING a student is a fun thing'",
				"This highlights that SER means literally 'to be' but can be translated as 'BEING'. Especially when 'BEING' is being used as a noun, or at the start of a noun phrase.",
				"Additionally, in Spanish we wouldn't say 'SER a student', the article actually dissappears and this because just 'SER student'. When SER is used before certain nouns used to describe people, like professions, the article isn't used.",
				"Examples: 'is a pilot' = 'es pilot', 'was a member' = 'era member'. We don't use 'UN' or 'UNA' in these cases.",
				"This 'BEING a student' or 'SER student' or any SER phrase like this is a noun phrase and can be placed in sentences as such.",
				"Remember prepositions are always used before nouns, so consider these examples: 'I did it PARA SER student' = 'I did it IN ORDER TO BE a student', or 'I did it POR SER student' = 'I did it BECUASE OF BEING a student'.",
				"Other preposition examples: 'What is the point of being a good student?' = 'What ES the point DE SER a good student' or 'We aren't fans of being bad people' = 'We NO SOMOS fans DE SER bad people'",
				"EN and CON can be used, though rarely, here as well: 'A lot of pride comes with being a good student' = 'A lot of pride come CON SER student' and 'We put emphasis on being a good student' = 'We put emphasis EN SER student'",
				"Don't worry about remembering all the specific contexts, the overall point is: Phrases that startwith SER can be treated as a noun in basically every way, including after prepositions.",
				"This form of the verb is called the INFINITIVE, a form that's typically used not as very function in a sentence, but as NOUN function. When we get to other verbs you will see a preposition used right before an infinitive ALL THE TIME in Spanish!",
			],
			wordBank: [pron.attribute.words.lo],
			sentences: [
				{
					id: 1,
					sentence: "They aren't my friends, but he is",
					translation: "ELLOS NO SON my amigos, but ÉL LO ES",
					data: [
						{ phrase: "They", translation: pron.subject.words.ellos },
						{
							phrase: "aren't",
							translation: [advrb.words.no, verb.words.ser.present.son],
							reference: ref("noContractions", "serIdentity"),
						},
						{ phrase: "my" },
						{ phrase: "friends", translation: noun.words.amigos },
						{ phrase: "but" },
						{ phrase: "he", translation: pron.subject.words.el },
						{
							phrase: "is",
							translation: [pron.attribute.words.lo, verb.words.ser.present.es],
							reference: ref("attributeLo"),
						},
					],
				},
				{
					id: 2,
					sentence: "The guy was from Argentina",
					translation: "EL CHICO ERA DE Argentina",
					data: [
						{
							phrase: "The guy",
							translation: [artcl.words.el, noun.words.chico],
						},
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serOrigin"),
						},
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Argentina", translation: noun.words.argentina },
					],
				},
				{
					id: 3,
					sentence: "I did it in order to be a student",
					translation: "I LO did PARA SER student",
					data: [
						{ phrase: "I" },
						{
							phrase: "did it",
							translation: pron.dObj.words.lo,
							reference: ref("dObjPosition"),
							phraseTranslation: "LO did",
						},
						{
							phrase: "in order to be",
							translation: [prep.words.para, verb.words.ser],
							reference: ref("paraSer"),
						},
						{ phrase: "student" },
					],
				},
				{
					id: 4,
					sentence: "I did it because of being a student",
					translation: "I LO did POR SER student",
					data: [
						{ phrase: "I" },
						{
							phrase: "did it",
							translation: pron.dObj.words.lo,
							reference: ref("dObjPosition"),
							phraseTranslation: "LO did",
						},
						{
							phrase: "because of being",
							translation: [prep.words.por, verb.words.ser],
							reference: ref("porBecauseOf", "serBeing"),
						},
						{ phrase: "student" },
					],
				},
				{
					id: 5,
					sentence: "We weren't friends, but they(M) were",
					translation: "NOSOTROS NO ÉRAMOS amigos, but ELLOS LO ERAN",
					data: [
						{ phrase: "We", translation: pron.subject.words.nosotros },
						{
							phrase: "weren't",
							translation: [advrb.words.no, verb.words.ser.past.eramos],
							reference: ref("noContractions", "serIdentity"),
						},
						{ phrase: "friends", translation: noun.words.amigos },
						{ phrase: "but" },
						{ phrase: "they(M)", translation: pron.subject.words.ellos },
						{
							phrase: "were",
							translation: [pron.attribute.words.lo, verb.words.ser.past.eran],
							reference: ref("attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 6,
					sentence: "That was because of being a jerk(F)",
					translation: "ESO ERA POR SER UNA jerk",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{
							phrase: "because of being",
							translation: [prep.words.por, verb.words.ser],
							reference: ref("porBecauseOf", "serBeing"),
						},
						{
							phrase: "a jerk(F)",
							translation: [artcl.words.una],
							reference: ref("serNoArticle"),
						},
					],
				},
				{
					id: 7,
					sentence: "He's a friend. She isn't",
					translation: "ÉL ES UN amigo. ELLA NO LO ES",
					data: [
						{
							phrase: "He's",
							translation: [pron.subject.words.el, verb.words.ser.present.es],
							reference: ref("serIdentity"),
						},
						{
							phrase: "a friend",
							translation: [artcl.words.un, noun.words.amigo],
							reference: ref("serNoArticle"),
						},
						{
							phrase: "She",
							translation: pron.subject.words.ella,
						},
						{
							phrase: "isn't",
							translation: [
								advrb.words.no,
								pron.attribute.words.lo,
								verb.words.ser.present.es,
							],
							reference: ref("noContractions", "attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 8,
					sentence: "The best thing was that he was my teacher",
					translation: "The best thing ERA QUE ÉL ERA my teacher",
					data: [
						{ phrase: "The best thing" },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{ phrase: "he", translation: pron.subject.words.el },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "my teacher" },
					],
				},
				{
					id: 9,
					sentence: "Why is she your friend?",
					translation: "POR QUÉ ES ELLA your friend?",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							reference: ref("porQueWhy"),
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "she", translation: pron.subject.words.ella },
						{ phrase: "your friend" },
					],
				},
				{
					id: 10,
					sentence: "I wasn't a member, but he was",
					translation: "YO NO ERA member, but ÉL LO ERA",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "wasn't a member",
							translation: [advrb.words.no, verb.words.ser.past.era],
							reference: ref("noContractions", "serIdentity", "serNoArticle"),
							phraseTranslation: "NO ERA member",
						},

						{ phrase: "but" },
						{ phrase: "he", translation: pron.subject.words.el },
						{
							phrase: "was",
							translation: [pron.attribute.words.lo, verb.words.ser.past.era],
							reference: ref("attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 11,
					sentence: "He isn't astudent, but I am",
					translation: "ÉL NO ES student, but YO LO SOY",
					data: [
						{ phrase: "He", translation: pron.subject.words.el },
						{
							phrase: "isn't a student",
							translation: [advrb.words.no, verb.words.ser.present.es],
							reference: ref("noContractions", "serIdentity", "serNoArticle"),
							phraseTranslation: "NO ES student",
						},
						{ phrase: "but" },
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "am",
							translation: [
								pron.attribute.words.lo,
								verb.words.ser.present.soy,
							],
							reference: ref("attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 12,
					sentence: "A lot of pride comes with being a student",
					translation: "A lot of pride comes CON SER student",
					data: [
						{ phrase: "A lot of pride comes" },
						{ phrase: "with", translation: prep.words.con },
						{
							phrase: "being a student",
							translation: verb.words.ser,
							phraseTranslation: "SER student",
							reference: ref("serBeing", "serNoArticle"),
						},
					],
				},
				{
					id: 13,
					sentence: "The issue is that he isn't here",
					translation: "The issue ES QUE ÉL NO is here",
					data: [
						{ phrase: "The issue" },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "he isn't here",
							translation: [pron.subject.words.el, advrb.words.no],
							phraseTranslation: "ÉL NO is here",
							reference: ref("serIdentity", "serNoLocation", "noContractions"),
						},
					],
				},
				{
					id: 14,
					sentence: "That was that",
					translation: "ESO ERA ESO",
					data: [
						{ phrase: "That", translation: pron.demonstrative.words.eso },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 15,
					sentence: "The problem is that he wants even more",
					translation: "The problem ES QUE ÉL wants even more",
					data: [
						{ phrase: "The problem" },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "he", translation: pron.subject.words.el },
						{ phrase: "wants even more" },
					],
				},
				{
					id: 16,
					sentence: "Why were you the teacher(M)?",
					translation: "POR QUÉ ERAS TÚ EL teacher(M)?",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							reference: ref("porQueWhy"),
						},
						{
							phrase: "were",
							translation: verb.words.ser.past.eras,
							reference: ref("serIdentity"),
						},
						{ phrase: "you", translation: pron.subject.words.tu },
						{
							phrase: "the teacher(M)",
							translation: [artcl.words.el],
							phraseTranslation: "EL teacher(M)",
						},
					],
				},
				{
					id: 17,
					sentence: "I want to be a teacher",
					translation: "I want SER teacher",
					data: [
						{ phrase: "I want" },
						{
							phrase: "to be a teacher",
							translation: verb.words.ser,
							phraseTranslation: "SER teacher",
							reference: ref("serBeing", "serNoArticle", "serIdentity"),
						},
					],
				},
				{
					id: 18,
					sentence: "Is your do a good boy?",
					translation: "ES your dog UN good CHICO?",
					data: [
						{
							phrase: "Is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "your dog" },
						{
							phrase: "a",
							translation: [artcl.words.un],
						},
						{
							phrase: "good boy",
							translation: [noun.words.chico],
							phraseTranslation: "good CHICO",
						},
					],
				},
				{
					id: 19,
					sentence: "Why weren't we friends(M)",
					translation: "POR QUÉ NO ÉRAMOS NOSOTROS AMIGOS",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							reference: ref("porQueWhy"),
						},
						{
							phrase: "weren't",
							translation: [advrb.words.no, verb.words.ser.past.eramos],
							reference: ref("serIdentity", "noContractions"),
						},
						{ phrase: "we", translation: pron.subject.words.nosotros },
						{
							phrase: "friends(M)",
							translation: [noun.words.amigo],
							plural: true,
						},
					],
				},
				{
					id: 20,
					sentence: "Why is that a problem",
					translation: "POR QUÉ ES ESO a problem",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							reference: ref("porQueWhy"),
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{ phrase: "a problem" },
					],
				},
				{
					id: 21,
					sentence: "The girl is my friend",
					translation: "LA CHICA ES my AMIGA",
					data: [
						{
							phrase: "The girl",
							translation: [artcl.words.la, noun.words.chica],
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "my" },
						{ phrase: "friend", translation: noun.words.amiga },
					],
				},
				{
					id: 22,
					sentence: "We put emphasis on being a student",
					translation: "We put emphasis EN SER student",
					data: [
						{ phrase: "We put emphasis" },
						{ phrase: "on", translation: prep.words.en },
						{
							phrase: "being a student",
							translation: verb.words.ser,
							phraseTranslation: "SER student",
							reference: ref("serBeing", "serNoArticle", "serIdentity"),
						},
					],
				},
				{
					id: 23,
					sentence: "My concern was that she didn't listen",
					translation: "My concern ERA QUE ELLA NO listened",
					data: [
						{ phrase: "My concern" },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "she", translation: pron.subject.words.ella },
						{
							phrase: "didn't listen",
							translation: [advrb.words.no],
							phraseTranslation: "NO listened",
							reference: ref("noDoContractions"),
						},
					],
				},
				{
					id: 24,
					sentence: "We aren't  fans of being unappreciated people",
					translation: "NOSOTROS NO SOMOS fans DE SER unappreciated people",
					data: [
						{ phrase: "We", translation: pron.subject.words.nosotros },
						{
							phrase: "aren't",
							translation: [advrb.words.no, verb.words.ser.present.somos],
							reference: ref("noContractions", "serIdentity"),
						},
						{ phrase: "fans" },
						{
							phrase: "of being",
							translation: [prep.words.de, verb.words.ser],
							reference: ref("serBeing", "serIdentity"),
						},
						{
							phrase: "unappreciated people",
						},
					],
				},
				{
					id: 25,
					sentence: "To be a student is a fun thing",
					translation: "SER student ES a fun thing",
					data: [
						{
							phrase: "To be a student",
							translation: verb.words.ser,
							phraseTranslation: "SER student",
							reference: ref("serBeing", "serNoArticle", "serIdentity"),
						},
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "a fun thing" },
					],
				},
				{
					id: 26,
					sentence: "We did it in order to be the winners(M)",
					translation: "NOSOTROS LO did PARA SER LOS winners",
					data: [
						{ phrase: "We", translation: pron.subject.words.nosotros },
						{
							phrase: "did it",
							translation: pron.dObj.words.lo,
							reference: ref("dObjPosition"),
							phraseTranslation: "LO did",
						},
						{
							phrase: "in order to be",
							translation: [prep.words.para, verb.words.ser],
							reference: ref("paraSer", "serBeing", "serIdentity"),
						},
						{
							phrase: "the winners(M)",
							translation: [artcl.words.los],
							phraseTranslation: "LOS winners",
						},
					],
				},
			],
		},
		{
			lesson: 20,
			name: "Lesson 20",
			details: "Full Quiz Review of all previous lessons",
			info: [
				"Today we’re going to practice everything we’ve learned so far, with emphasis on the advanced uses of Ser that we learned in the last lesson.",
			],
			sentences: [
				{
					id: 1,
					sentence: "The guys are coming from over there",
					translation: "LOS CHICOS are coming DE over there",
					data: [
						{
							phrase: "The guys are coming",
							translation: [artcl.words.los, noun.words.chicos],
							phraseTranslation: "LOS CHICOS are coming",
							reference: ref("serNoDoing"),
						},
						{
							phrase: "from",
							translation: prep.words.de,
						},
						{ phrase: "over there" },
					],
				},
				{
					id: 2,
					sentence: "The problem was that he didn't know her",
					translation: "The problem ERA QUE ÉL NO LA knew",
					data: [
						{
							phrase: "The problem",
						},
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "he", translation: pron.subject.words.el },
						{
							phrase: "didn't know her",
							translation: [advrb.words.no, pron.dObj.words.la],
							phraseTranslation: "NO LA knew",
							reference: ref("noDoContractions", "dObjPosition"),
						},
					],
				},
				{
					id: 3,
					sentence: "It's the girl's friend(M)",
					translation: "ES EL AMIGO DE LA CHICA",
					data: [
						{
							phrase: "It's",
							translation: verb.words.ser.present.es,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{ phrase: "the", translation: artcl.words.el },
						{
							phrase: "girl's friend(M)",
							translation: [
								noun.words.amigo,
								prep.words.de,
								artcl.words.la,
								noun.words.chica,
							],
							reference: ref("dePossessionContractions"),
						},
					],
				},
				{
					id: 4,
					sentence: "What is your paper cup on?",
					translation: "EN QUÉ ES your cup DE paper?",
					data: [
						{
							phrase: "What is your paper cup on?",
							translation: [
								prep.words.en,
								pron.interrogative.words.que,
								verb.words.ser.present.es,
								prep.words.de,
							],
							phraseTranslation: "EN QUÉ ES your cup DE paper?",
							reference: ref("prepPosition", "serIdentity", "deMaterial"),
						},
					],
				},
				{
					id: 5,
					sentence: "My concern is that my friend isn't here",
					translation: "My concern ES QUE my AMIGO NO is here",
					data: [
						{ phrase: "My concern" },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "my" },
						{ phrase: "friend", translation: noun.words.amigo },
						{
							phrase: "isn't here",
							translation: [advrb.words.no],
							phraseTranslation: "NO is here",
							reference: ref("noContractions", "serNoLocation"),
						},
					],
				},
				{
					id: 6,
					sentence: "You are with the guy?",
					translation: "TÚ are CON EL CHICO?",
					data: [
						{ phrase: "You", translation: pron.subject.words.tu },
						{
							phrase: "are with",
							translation: prep.words.con,
							phraseTranslation: "are CON",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "the guy",
							translation: [artcl.words.el, noun.words.chico],
						},
					],
				},
				{
					id: 7,
					sentence: "It was by my favorite author",
					translation: "ERA POR my favorite author",
					data: [
						{
							phrase: "It was",
							translation: verb.words.ser.past.era,
							noPronoun: true,
						},
						{
							phrase: "by",
							translation: prep.words.por,
							reference: ref("porAndSer"),
						},
						{ phrase: "my favorite author" },
					],
				},
				{
					id: 8,
					sentence: "It's because of that",
					translation: "ES POR ESO",
					data: [
						{
							phrase: "It's",
							translation: verb.words.ser.present.es,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf", "porAndSer"),
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 9,
					sentence: "Are they friends? We are",
					translation: "SON AMIGOS? NOSOTROS LO SOMOS",
					data: [
						{
							phrase: "Are they",
							translation: [verb.words.ser.present.son],
							phraseTranslation: "SON",
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{ phrase: "friends", translation: noun.words.amigo, plural: true },
						{
							phrase: "We",
							translation: pron.subject.words.nosotros,
						},
						{
							phrase: "are",
							translation: [
								pron.attribute.words.lo,
								verb.words.ser.present.somos,
							],
							reference: ref("attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 10,
					sentence: "Why are you here at 6?",
					translation: "POR QUÉ are TÚ here A 6?",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							reference: ref("porQueWhy"),
						},
						{
							phrase: "are you here",
							translation: [pron.subject.words.tu],
							phraseTranslation: "are TÚ here",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "at",
							translation: prep.words.a,
							reference: ref("aAndTime"),
						},
					],
				},
				{
					id: 11,
					sentence: "We were friends so that you could have that",
					translation: "ÉRAMOS AMIGOS PARA QUE TÚ could have ESO",
					data: [
						{ phrase: "We", translation: pron.subject.words.nosotros },
						{
							phrase: "were",
							translation: verb.words.ser.past.eramos,
							reference: ref("serIdentity"),
						},
						{ phrase: "friends", translation: noun.words.amigo, plural: true },
						{
							phrase: "so that",
							translation: [prep.words.para, conj.words.que],
							reference: ref("paraQueConj"),
						},
						{
							phrase: "you",
							translation: pron.subject.words.tu,
						},
						{ phrase: "could have" },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 12,
					sentence: "You said that you(M) were a friend.",
					translation: "TÚ said QUE ERAS UN amigo",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.tu,
						},
						{ phrase: "said" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "you were",
							translation: verb.words.ser.past.eras,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "a friend(M)",
							translation: [artcl.words.un, noun.words.amigo],
						},
					],
				},
				{
					id: 13,
					sentence: "It's because of the girls",
					translation: "ES POR LAS CHICAS",
					data: [
						{
							phrase: "It's",
							translation: verb.words.ser.present.es,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf", "porAndSer"),
						},
						{
							phrase: "the",
							translation: [artcl.words.las],
						},
						{
							phrase: "girls",
							translation: [noun.words.chica],
							plural: true,
						},
					],
				},
				{
					id: 14,
					sentence: "The girls are here in order to be your friends",
					translation: "LAS CHICAS are here PARA SER your AMIGAS",
					data: [
						{
							phrase: "The",
							translation: [artcl.words.las],
						},
						{
							phrase: "girls",
							translation: [noun.words.chica],
							plural: true,
						},
						{
							phrase: "are here",
						},
						{
							phrase: "in order to be",
							translation: [prep.words.para, verb.words.ser],
							reference: ref("paraSer", "serBeing", "serIdentity"),
						},
						{ phrase: "your" },
						{ phrase: "friends", translation: noun.words.amiga, plural: true },
					],
				},
				{
					id: 15,
					sentence: "She is taller than he",
					translation: "ELLA ES taller QUE ÉL",
					data: [
						{ phrase: "She", translation: pron.subject.words.ella },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity", "serPhysical"),
						},
						{ phrase: "taller" },
						{
							phrase: "than",
							translation: conj.words.que,
							reference: ref("queAsThan"),
						},
						{ phrase: "he", translation: pron.subject.words.el },
					],
				},
				{
					id: 16,
					sentence: "He's from Chile",
					translation: "ES DE Chile",
					data: [
						{
							phrase: "He's",
							translation: verb.words.ser.present.es,
							noPronoun: true,
						},
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Chile" },
					],
				},
				{
					id: 17,
					sentence: "I wasn't their friend(F), but she was.",
					translation: "YO NO ERA their AMIGA, but ELLA LO ERA.",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "wasn't",
							translation: [advrb.words.no, verb.words.ser.past.era],
							reference: ref("noContractions", "serIdentity"),
						},
						{
							phrase: "their",
						},
						{ phrase: "friend(F)", translation: noun.words.amiga },
						{ phrase: "but" },
						{ phrase: "she", translation: pron.subject.words.ella },
						{
							phrase: "was",
							translation: [pron.attribute.words.lo, verb.words.ser.past.era],
							reference: ref("attributeLo", "serIdentity"),
							phraseTranslation: "LO ERA",
						},
					],
				},
				{
					id: 18,
					sentence: "I'm a girl",
					translation: "SOY UNA CHICA",
					data: [
						{
							phrase: "I'm",
							translation: [verb.words.ser.present.soy],
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{ phrase: "a", translation: [artcl.words.una] },
						{ phrase: "girl", translation: [noun.words.chica] },
					],
				},
				{
					id: 19,
					sentence: "And that was because of being his friend(M)",
					translation: "Y ESO ERA POR SER his AMIGO",
					data: [
						{ phrase: "And", translation: conj.words.y },
						{ phrase: "that", translation: pron.demonstrative.words.eso },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{
							phrase: "because of being",
							translation: [prep.words.por, verb.words.ser],
							reference: ref("porBecauseOf", "serBeing"),
						},
						{ phrase: "his" },
						{ phrase: "friend(M)", translation: noun.words.amigo },
					],
				},
				{
					id: 20,
					sentence: "They(F) knew me, they were my friends(F)",
					translation: "ELLAS ME knew, ERAN my AMIGAS",
					data: [
						{ phrase: "They(F)", translation: pron.subject.words.ellas },
						{
							phrase: "knew me",
							translation: [pron.dObj.words.me],
							reference: ref("dObjPosition", "serIdentity"),
							phraseTranslation: "ME knew",
						},
						{
							phrase: "they were",
							translation: verb.words.ser.past.eran,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{ phrase: "my" },
						{
							phrase: "friends(F)",
							translation: noun.words.amiga,
							plural: true,
						},
					],
				},
				{
					id: 21,
					sentence: "I was at the station because of being a thief(M)",
					translation: "YO was EN the station POR SER UN thief",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "was at",
							translation: [prep.words.en],
							phraseTranslation: "was EN",
							reference: ref("serNoLocation"),
						},
						{
							phrase: "the station",
						},
						{
							phrase: "because of being",
							translation: [prep.words.por, verb.words.ser],
							reference: ref("porBecauseOf", "serBeing"),
						},
						{ phrase: "a", translation: artcl.words.un },
						{ phrase: "thief(M)" },
					],
				},
				{
					id: 22,
					sentence: "The girl that knows you has that",
					translation: "LA CHICA QUE TE knows has ESO",
					data: [
						{
							phrase: "the girl",
							translation: [artcl.words.la, noun.words.chica],
						},
						{
							phrase: "that",
							translation: [conj.words.que],
						},
						{
							phrase: "knows you",
							translation: [pron.dObj.words.te],
							phraseTranslation: "TE knows",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "has",
						},
						{ phrase: "that", translation: pron.demonstrative.words.eso },
					],
				},
				{
					id: 23,
					sentence: "My concern is that he ran to the store.",
					translation: "My concern ES QUE ÉL ran A the store.",
					data: [
						{ phrase: "My concern" },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "he", translation: pron.subject.words.el },
						{ phrase: "ran" },
						{
							phrase: "to",
							translation: prep.words.a,
						},
						{ phrase: "the store" },
					],
				},
				{
					id: 24,
					sentence: "The guy is around here",
					translation: "EL CHICO is POR here",
					data: [
						{
							phrase: "The guy",
							translation: [artcl.words.el, noun.words.chico],
						},
						{
							phrase: "is around",
							translation: [prep.words.por],
							phraseTranslation: "is POR",
							reference: ref("serNoLocation", "porAndSer", "porLocation"),
						},
						{ phrase: "here" },
					],
				},
				{
					id: 25,
					sentence: "What is the point of being friends(M)?",
					translation: "What ES the point DE SER AMIGOS?",
					data: [
						{ phrase: "What" },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "the point" },
						{ phrase: "of", translation: prep.words.de },
						{
							phrase: "being",
							translation: verb.words.ser,
							reference: ref("serBeing"),
						},
						{
							phrase: "friends(M)",
							translation: noun.words.amigo,
							plural: true,
						},
					],
				},
				{
					id: 26,
					sentence: "It was a friend, that's why she watched him",
					translation: "ERA UN AMIGO, POR ESO ELLA LO watched",
					data: [
						{
							phrase: "It was",
							translation: verb.words.ser.past.era,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "a friend",
							translation: [artcl.words.un, noun.words.amigo],
						},
						{
							phrase: "that's why",
							translation: [prep.words.por, pron.demonstrative.words.eso],
							reference: ref("porEso"),
						},
						{
							phrase: "she",
							translation: pron.subject.words.ella,
						},
						{
							phrase: "watched him",
							translation: [pron.dObj.words.lo],
							phraseTranslation: "LO watched",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 27,
					sentence: "I met them(M) in order to be friends",
					translation: "YO LOS met PARA SER AMIGOS",
					data: [
						{
							phrase: "I",
							translation: pron.subject.words.yo,
						},
						{
							phrase: "met them(M)",
							translation: [pron.dObj.words.los],
							phraseTranslation: "LOS met",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "in order to be",
							translation: [prep.words.para, verb.words.ser],
							reference: ref("paraSer", "serBeing", "serIdentity"),
						},
						{
							phrase: "friends(M)",
							translation: noun.words.amigo,
							plural: true,
						},
					],
				},
				{
					id: 28,
					sentence: "You and we(F) were friends(F)",
					translation: "TÚ Y NOSOTRAS ÉRAMOS AMIGAS",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.tu,
						},
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "we(F)", translation: pron.subject.words.nosotras },
						{
							phrase: "were",
							translation: verb.words.ser.past.eramos,
							reference: ref("serIdentity"),
						},
						{
							phrase: "friends(F)",
							translation: noun.words.amiga,
							plural: true,
						},
					],
				},
				{
					id: 29,
					sentence: "Why were you his friend(M)",
					translation: "POR QUÉ ERAS TÚ his AMIGO",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							reference: ref("porQueWhy"),
						},
						{
							phrase: "were",
							translation: verb.words.ser.past.eras,
							reference: ref("serIdentity"),
						},
						{ phrase: "you", translation: pron.subject.words.tu },
						{ phrase: "his" },
						{ phrase: "friend(M)", translation: noun.words.amigo },
					],
				},
				{
					id: 30,
					sentence: "It's for the girl's friends(M)",
					translation: "ES PARA LOS AMIGOS DE LA CHICA",
					data: [
						{
							phrase: "It's",
							translation: verb.words.ser.present.es,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "for",
							translation: prep.words.para,
							reference: ref("paraFor"),
						},
						{
							phrase: "the girl's friends(M)",
							translation: [
								artcl.words.los,
								asPlural(noun.words.amigo),
								prep.words.de,
								artcl.words.la,
								noun.words.chica,
							],
							reference: ref("dePossessionContractions"),
						},
					],
				},
				{
					id: 31,
					sentence: "They were friends for many years",
					translation: "ERAN AMIGOS POR many years",
					data: [
						{
							phrase: "They were",
							translation: verb.words.ser.past.eran,
							noPronoun: true,
						},
						{ phrase: "friends", translation: asPlural(noun.words.amigo) },
						{
							phrase: "for",
							translation: prep.words.por,
							reference: ref("porFor"),
						},
						{
							phrase: "many years",
						},
					],
				},
				{
					id: 32,
					sentence: "How strange that he's in the car",
					translation: "QUÉ strange QUE ÉL is EN the car",
					data: [
						{
							phrase: "How strange",
							translation: [pron.interrogative.words.que],
							reference: ref("queExclamation"),
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "he", translation: pron.subject.words.el },
						{
							phrase: "is in",
							translation: prep.words.en,
							phraseTranslation: "is EN",
							reference: ref("serNoLocation"),
						},
						{ phrase: "the car" },
					],
				},
				{
					id: 33,
					sentence: "I was the girl that walked along this street",
					translation: "YO ERA LA CHICA QUE walked POR this street",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{
							phrase: "the girl",
							translation: [artcl.words.la, noun.words.chica],
						},
						{
							phrase: "that",
							translation: conj.words.que,
						},
						{ phrase: "walked" },
						{
							phrase: "along",
							translation: prep.words.por,
							reference: ref("porAlong"),
						},
						{ phrase: "this street" },
					],
				},
				{
					id: 34,
					sentence: "She isn't a friend, you are",
					translation: "ELLA NO is UN AMIGA, TÚ LO ARE",
					data: [
						{ phrase: "She", translation: pron.subject.words.ella },
						{
							phrase: "isn't",
							translation: [advrb.words.no, verb.words.ser.present.es],
							reference: ref("serIdentity", "noContractions"),
						},
						{
							phrase: "a friend",
							translation: [artcl.words.un, noun.words.amiga],
						},
						{ phrase: "you", translation: pron.subject.words.tu },
						{
							phrase: "are",
							translation: [
								pron.attribute.words.lo,
								verb.words.ser.present.soy,
							],
							reference: ref("attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 35,
					sentence: "I said that needs to be here by tonight",
					translation: "YO said QUE ESO NEEDS to be here PARA tonight",
					data: [
						{
							phrase: "I said that",
							phraseTranslation: "YO said QUE ESO",
							translation: [
								pron.subject.words.yo,
								conj.words.que,
								pron.demonstrative.words.eso,
							],
							reference: ref("queConnector"),
						},
						{ phrase: "needs to be here" },
						{
							phrase: "by tonight",
							translation: [prep.words.para],
							phraseTranslation: "PARA tonight",
							reference: ref("paraDeadlines"),
						},
					],
				},
			],
		},
		{
			lesson: 21,
			name: "Lesson 21",
			details: "Usted: The formal 'You' subject pronoun",
			info: [
				"We are introducing the 'formal' subject pronoun 'Usted' today. Unlike all the other subject pronoun this is a person that doesn't exist in Spanish! ",
				"Let's say you walk into a store and want to speak with the store owner, it's considered very informal to use the normal way of saying 'you' (tú) with someone you don't know, so we use 'usted' instead.",
				"To double down on this quirk here: when using the formal 'you' (usted), we also don't use the verb conjugation that goes with 'you' (eres) but rather the conjugation for he/she/it (es).",
				"So 'you are' in a formal way is 'usted es' (not 'usted eres').",
				"This is also very dependent on what region of Spanish you’re dealing with. For example, in Argentina, the usted form is very rarely used, but there are also regional dialects in some other parts of South America where the tú form is rarely used and most people speak in usted most of the time except with very intimate acquaintances.",
				"For English speakers this feels like a whole new thing to worry about, since we don't separate formal from informal ways of talking in a grammatical sense.",
				"Usted is not changed based on gender: 'You aren't a teacher?' = 'Usted no era un profesor'",
				"However there will be situations when you are speaking with someone in a formal voice, and they end up being the Direct Object in the sentence",
				"If your formal person becomes the direct object we don't use the 'YOU/TE' form of dObjs, we instead use the it/him/her form: LO/LA",
				"This can seem odd, since 'they know you' might be translated as 'Ellos Lo know' which seems like 'They know him', weird to use 'him' or 'her' to refer to a person you are talking directly to. But it's considered polite, and formal.",
				"The last confusing bit here is that Spanish uses the USTED form without actually naming USTED at all: this happens a lot with ES, which can refer to an it, he, she, or now an unnamed USTED",
				"For Example: 'Es un amigo' can mean 'he is a friend' or 'you are my friend' in a formal voice, this is the kind of thing that has to be picked up from the context.",
				"For now and in the following quizzes we will specify when the sentence is in a Formal voice, just like specifying wether subject pronouns are required in earlier examples.",
			],
			sentences: [
				{
					id: 1,
					sentence: "You are a teacher",
					translation: "USTED ES a teacher",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "a teacher" },
					],
				},
				{
					id: 2,
					sentence: "He isn't my friend, you are",
					translation: "ÉL NO ES my AMIGO, USTED LO ES",
					data: [
						{ phrase: "He", translation: pron.subject.words.el },
						{
							phrase: "isn't",
							translation: [advrb.words.no, verb.words.ser.present.es],
							reference: ref("serIdentity", "noContractions"),
						},
						{ phrase: "my" },
						{ phrase: "friend", translation: noun.words.amigo },
						{
							phrase: "you",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "are",
							translation: [pron.attribute.words.lo, verb.words.ser.present.es],
							reference: ref("attributeLo", "serIdentity", "usted3rdPerson"),
						},
					],
				},
				{
					id: 3,
					sentence: "You weren't his friend(F)?",
					translation: "USTED NO ERA his AMIGA?",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "weren't",
							translation: [advrb.words.no, verb.words.ser.past.era],
							reference: ref("noContractions", "serIdentity", "usted3rdPerson"),
						},
						{ phrase: "his" },
						{ phrase: "friend(F)", translation: noun.words.amiga },
					],
				},
				{
					id: 4,
					sentence: "They(F) don't know you(F)",
					translation: "ELLAS NO LA know",
					data: [
						{ phrase: "They(F)", translation: pron.subject.words.ellas },
						{
							phrase: "don't know you(F)",
							translation: [advrb.words.no, pron.dObj.words.la],
							phraseTranslation: "NO LA know",
							reference: ref("noDoContractions", "dObjPosition"),
						},
					],
				},
				{
					id: 5,
					sentence: "I knew you(M) when you were a teacher",
					translation: "YO LO knew when USTED ERA my teacher",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "knew you(M)",
							translation: [pron.dObj.words.lo],
							phraseTranslation: "LO knew",
							reference: ref("dObjPosition", "ustedDirectObject"),
						},
						{ phrase: "when" },
						{
							phrase: "you",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "were",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity", "usted3rdPerson"),
						},
						{ phrase: "my" },
						{ phrase: "teacher" },
					],
				},
				{
					id: 6,
					sentence: "Oh, you're from Bolivia?",
					translation: "Oh, ES DE Bolivia?",
					data: [
						{ phrase: "Oh," },
						{
							phrase: "you're",
							translation: verb.words.ser.present.es,
							noPronoun: true,
							isFormal: true,
							reference: ref("ustedNoPronoun", "serOrigin"),
						},
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Bolivia" },
					],
				},
				{
					id: 7,
					sentence: "I am not the girl that saw you(F)",
					translation: "YO NO SOY LA CHICA QUE LA saw",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "am not",
							translation: [advrb.words.no, verb.words.ser.present.soy],
						},
						{
							phrase: "the girl",
							translation: [artcl.words.la, noun.words.chica],
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "saw you(F)",
							translation: [pron.dObj.words.la],
							phraseTranslation: "LA saw",
							noPronoun: true,
							isFormal: true,
						},
					],
				},
				{
					id: 8,
					sentence: "She knows you(F), because of being your student",
					translation: "ELLA LA knows, POR SER your student",
					data: [
						{ phrase: "She", translation: pron.subject.words.ella },
						{
							phrase: "knows you(F)",
							translation: [pron.dObj.words.la],
							phraseTranslation: "LA knows",
							reference: ref("dObjPosition", "ustedDirectObject"),
							isFormal: true,
						},
						{
							phrase: "because of being",
							translation: [prep.words.por, verb.words.ser],
							reference: ref("porBecauseOf", "serBeing"),
						},
						{ phrase: "your" },
						{ phrase: "student" },
					],
				},
				{
					id: 9,
					sentence: "He said that you're his favorite teacher",
					translation: "ÉL said QUE ES his favorite teacher",
					data: [
						{ phrase: "He", translation: pron.subject.words.el },
						{ phrase: "said" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "you're",
							translation: verb.words.ser.present.es,
							noPronoun: true,
							isFormal: true,
							reference: ref("ustedNoPronoun", "serIdentity", "usted3rdPerson"),
						},
						{ phrase: "his" },
						{ phrase: "favorite teacher" },
					],
				},
				{
					id: 10,
					sentence: "The problem is that they(M) are further away than he",
					translation: "The problem ES QUE ELLOS are further away QUE ÉL",
					data: [
						{ phrase: "The problem" },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "they(M) are further",
							translation: pron.subject.words.ellos,
							reference: ref("serNoLocation"),
							phraseTranslation: "ELLOS are further",
						},
						{ phrase: "away" },
						{
							phrase: "than",
							translation: conj.words.que,
							reference: ref("queAsThan"),
						},
						{ phrase: "he", translation: pron.subject.words.el },
					],
				},
				{
					id: 11,
					sentence: "Are you the girl's friend(F)?",
					translation: "ERES TÚ LA AMIGA DE LA CHICA?",
					data: [
						{
							phrase: "Are",
							translation: verb.words.ser.present.eres,
						},
						{ phrase: "you", translation: pron.subject.words.tu },
						{ phrase: "the", translation: artcl.words.la },
						{
							phrase: "girl's friend(F)?",
							translation: [
								artcl.words.la,
								noun.words.amiga,
								prep.words.de,
								artcl.words.la,
								noun.words.chica,
							],
							reference: ref("dePossessionContractions"),
						},
					],
				},
				{
					id: 12,
					sentence: "I didn't know that you were the same guy!",
					translation: "YO NO knew QUE ERA EL same CHICO!",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "didn't know",
							translation: advrb.words.no,
							phraseTranslation: "NO knew",
							reference: ref("noDoContractions"),
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "you were",
							translation: verb.words.ser.past.era,
							noPronoun: true,
							reference: ref("serIdentity", "usted3rdPerson", "ustedNoPronoun"),
							isFormal: true,
						},
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "same" },
						{ phrase: "guy", translation: noun.words.chico },
					],
				},
				{
					id: 13,
					sentence: "If they(F) are my friends, you(M) are my friend",
					translation: "If ELLAS SON my AMIGAS, USTED ES my AMIGO",
					data: [
						{ phrase: "If" },
						{ phrase: "they(F)", translation: pron.subject.words.ellas },
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
							reference: ref("serIdentity"),
						},
						{ phrase: "my" },
						{ phrase: "friends", translation: asPlural(noun.words.amiga) },
						{
							phrase: "you(M)",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity", "usted3rdPerson"),
						},
						{ phrase: "my" },
						{ phrase: "friend", translation: noun.words.amigo },
					],
				},
				{
					id: 14,
					sentence: "We are the lady's daughters",
					translation: "SOMOS LAS daughters DE LA lady",
					data: [
						{
							phrase: "We are",
							translation: verb.words.ser.present.somos,
							noPronoun: true,
						},
						{
							phrase: "the lady's daughters",
							translation: [artcl.words.las, prep.words.de, artcl.words.la],
							reference: ref("dePossessionContractions"),
							phraseTranslation: "LAS daughters DE LA lady",
						},
					],
				},
				{
					id: 15,
					sentence: "What he saw was that you were my friend(M)",
					translation: "What ÉL saw ERA QUE ERAS my AMIGO",
					data: [
						{ phrase: "What" },
						{ phrase: "He", translation: pron.subject.words.el },
						{ phrase: "saw" },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "you were",
							translation: verb.words.ser.past.eras,
							noPronoun: true,
						},
						{ phrase: "my" },
						{ phrase: "friend(M)", translation: noun.words.amigo },
					],
				},
				{
					id: 16,
					sentence: "Why are we(F) the chosen ones?",
					translation: "POR QUÉ SOMOS NOSOTRAS LAS chosen ones?",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							reference: ref("porQueWhy"),
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.somos,
						},
						{ phrase: "we(F)", translation: pron.subject.words.nosotras },
						{ phrase: "the", translation: artcl.words.las },
						{ phrase: "chosen ones" },
					],
				},
				{
					id: 17,
					sentence: "Being a wooden boy was a unique experience",
					translation: "SER UN CHICO DE wood ERA a unique experience",
					data: [
						{
							phrase: "Being",
							translation: verb.words.ser,
							reference: ref("serBeing"),
						},
						{ phrase: "a", translation: artcl.words.un },
						{
							phrase: "wooden boy",
							phraseTranslation: "CHICO DE wood",
							translation: [noun.words.chico, prep.words.de],
							reference: ref("deMaterial"),
						},
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
						},
						{
							phrase: "a unique experience",
						},
					],
				},
				{
					id: 18,
					sentence: "They're my friends(M) in order to be your friends(M)",
					translation: "SON my AMIGOS PARA SER your AMIGOS",
					data: [
						{
							phrase: "They're",
							translation: verb.words.ser.present.son,
							noPronoun: true,
						},
						{
							phrase: "my",
						},
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
						{
							phrase: "in order to be",
							translation: [prep.words.para, verb.words.ser],
							reference: ref("paraSer", "serBeing", "serIdentity"),
						},
						{ phrase: "your" },
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
					],
				},
				{
					id: 19,
					sentence: "We(M) weren't customers, but you(M) were.",
					translation: "NOSOTROS NO ÉRAMOS customers, but USTED LO ERA",
					data: [
						{
							phrase: "We(M)",
							translation: pron.subject.words.nosotros,
						},
						{
							phrase: "weren't",
							translation: [advrb.words.no, verb.words.ser.past.eramos],
							reference: ref("noContractions", "serIdentity"),
						},
						{ phrase: "customers" },
						{ phrase: "but" },
						{
							phrase: "you(M)",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "were",
							translation: [pron.attribute.words.lo, verb.words.ser.past.era],
							reference: ref(
								"attributeLo",
								"serIdentity",
								"usted3rdPerson",
								"ustedDirectObject"
							),
						},
					],
				},
				{
					id: 20,
					sentence: "They(M) said they saw you(M) at the theater",
					translation: "ELLOS said QUE LO saw EN the theater",
					data: [
						{ phrase: "They(M)", translation: pron.subject.words.ellos },
						{
							phrase: "said they saw you(M)",
							translation: [conj.words.que, pron.dObj.words.lo],
							phraseTranslation: "said QUE LO saw",
							isFormal: true,
							reference: ref(
								"queConnector",
								"dObjPosition",
								"ustedDirectObject"
							),
						},
						{
							phrase: "at",
							translation: prep.words.en,
						},
						{ phrase: "the theater" },
					],
				},
			],
		},
		{
			lesson: 22,
			name: "Lesson 22",
			details:
				"New Verb! ESTAR the other form of TO BE, and it's contrast with SER(to be)",
			info: [
				"So far there have been a lot of 'to be' situations where we haven't been allowed to use SER. Where 'is', 'were', and 'am' etc. didn't translate to ES, ERAN, etc.",
				"The name of the other verb is ESTAR, which is it's inifinitve form, and it's another translation of the English verb 'to be'",
				"This alternate form of 'to be': ESTAR, is used specifically in the sense of 'HOW' or 'WHERE' something is. Not WHAT it is.",
				"SER = What something is. ESTAR = Where, or How something is",
				"It should be fairly easy to start thinking of places that ESTAR can be used, because you would use it in a LOT of the places where we HAVEN'T been translating 'to be' as SER",
				"The easiest way to use ESTAR is to simply refer to a place: 'That is here'. Now this wouldn't use SER because we aren't describing 'What' that is, but 'Where' that is.",
				"So 'That is here' is 'ESO ESTÁ here' not 'ESO ES here'",
				"ESTÁ is the third person singular conjugation of ESTAR, here are the rest:",
				"ESTOY (I am), ESTÁS (you are), ESTÁ (he/she/it is), ESTAMOS (we are), ESTÁN (they are)",
				"Think abut te sentence 'That is here' again. Let's talk about the word coming after 'is' which is 'here'. 'Here' isn't a noun, it's an adverb.",
				"As a general rule, a conjugation of Estar will never be directly followed by a noun, but is very often followed by adverbs.",
				"Another common way to use ESTAR is by following it with phrases that start with prepositions, specificlly preposition referring to a location",
				"Examples includ: 'That is at the park', 'That is with my friends', 'That is by the path' but the easiest way is simply using the word 'here' which is aquí",
				"ESTAR can be used as the inifitie form (to be/being) just like SER has this option. 'I like being here' = 'I like ESTAR here'",
			],
			wordBank: [
				verb.words.estar,
				advrb.words.aqui,
				verb.words.estar.present.esta,
				verb.words.estar.present.estan,
				verb.words.estar.present.estoy,
				verb.words.estar.present.estas,
				verb.words.estar.present.estamos,
			],
			sentences: [
				{
					id: 1,
					sentence: "That is here",
					translation: "ESO ESTÁ AQUÍ",
					data: [
						{
							phrase: "That",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "is",
							translation: verb.words.estar.present.esta,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 2,
					sentence: "That is with my friends",
					translation: "ESO ESTÁ CON my AMIGOS",
					data: [
						{
							phrase: "That",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "is",
							translation: verb.words.estar.present.esta,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "with", translation: prep.words.con },
						{ phrase: "my" },
						{ phrase: "friends", translation: asPlural(noun.words.amigo) },
					],
				},
				{
					id: 3,
					sentence: "That is by the path",
					translation: "ESO ESTÁ POR the path",
					data: [
						{
							phrase: "That",
							translation: pron.demonstrative.words.eso,
						},
						{
							phrase: "is",
							translation: verb.words.estar.present.esta,
							reference: ref("estarHowAndWhere"),
						},
						{
							phrase: "by",
							translation: prep.words.por,
							reference: ref("porLocation"),
						},
						{ phrase: "the path" },
					],
				},
				{
					id: 4,
					sentence: "The guy is here",
					translation: "EL CHICO ESTÁ AQUÍ",
					data: [
						{
							phrase: "The guy",
							translation: [artcl.words.el, noun.words.chico],
						},
						{
							phrase: "is",
							translation: verb.words.estar.present.esta,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 5,
					sentence: "You are around here",
					translation: "ESTÁS POR AQUÍ",
					data: [
						{
							phrase: "You are",
							translation: verb.words.estar.present.estas,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{
							phrase: "around",
							translation: prep.words.por,
							reference: ref("porLocation"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 6,
					sentence: "I am not with the friends(M)",
					translation: "NO ESTOY CON LOS AMIGOS",
					data: [
						{
							phrase: "I am not",
							translation: [advrb.words.no, verb.words.estar.present.estoy],
							noPronoun: true,
							reference: ref("estarHowAndWhere", "noVerbPosition"),
						},
						{ phrase: "with", translation: prep.words.con },
						{
							phrase: "the friends(M)",
							translation: [artcl.words.los, asPlural(noun.words.amigo)],
						},
					],
				},
				{
					id: 7,
					sentence: "I am here",
					translation: "ESTOY AQUÍ",
					data: [
						{
							phrase: "I am",
							translation: verb.words.estar.present.estoy,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 8,
					sentence: "It isn't the friend(F)",
					translation: "NO ES LA AMIGA",
					data: [
						{
							phrase: "It isn't",
							translation: [advrb.words.no, verb.words.ser.present.es],
							noPronoun: true,
							reference: ref("serIdentity", "noContractions"),
						},
						{
							phrase: "the friend(F)",
							translation: [artcl.words.la, noun.words.amiga],
						},
					],
				},
				{
					id: 9,
					sentence: "The friend(M) is here",
					translation: "EL AMIGO ESTÁ AQUÍ",
					data: [
						{
							phrase: "The friend(M)",
							translation: [artcl.words.el, noun.words.amigo],
						},
						{
							phrase: "is",
							translation: verb.words.estar.present.esta,
							reference: ref("estarHowAndWhere"),
						},
						{
							phrase: "here",
							translation: advrb.words.aqui,
						},
					],
				},
				{
					id: 10,
					sentence: "The boys are friends",
					translation: "LOS CHICOS SON AMIGOS",
					data: [
						{
							phrase: "The boys",
							translation: [artcl.words.los, asPlural(noun.words.chico)],
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
							reference: ref("serIdentity"),
						},
						{
							phrase: "friends",
							translation: asPlural(noun.words.amigo),
						},
					],
				},
				{
					id: 11,
					sentence: "You are here",
					translation: "ESTÁS AQUÍ",
					data: [
						{
							phrase: "You are",
							translation: verb.words.estar.present.estas,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 12,
					sentence: "You(formal) are here",
					translation: "USTED ESTA AQUI",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "are",
							translation: verb.words.estar.present.esta,
							reference: ref("estarHowAndWhere", "usted3rdPerson"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 13,
					sentence: "We are with the friends(F)",
					translation: "ESTAMOS CON LAS AMIGAS",
					data: [
						{
							phrase: "We are",
							translation: verb.words.estar.present.estamos,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "with", translation: prep.words.con },
						{
							phrase: "the friends(F)",
							translation: [artcl.words.las, asPlural(noun.words.amiga)],
						},
					],
				},
				{
					id: 14,
					sentence: "I'm the girl",
					translation: "SOY LA CHICA",
					data: [
						{
							phrase: "I'm",
							translation: verb.words.ser.present.soy,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "the girl",
							translation: [artcl.words.la, noun.words.chica],
						},
					],
				},
				{
					id: 15,
					sentence: "They are not here",
					translation: "NO ESTÁN AQUÍ",
					data: [
						{
							phrase: "They are not",
							translation: [advrb.words.no, verb.words.estar.present.estan],
							noPronoun: true,
							reference: ref("estarHowAndWhere", "noVerbPosition"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 16,
					sentence: "You aren't the guy",
					translation: "NO ERES EL CHICO",
					data: [
						{
							phrase: "You aren't",
							translation: [advrb.words.no, verb.words.ser.present.eres],
							noPronoun: true,
							reference: ref("serIdentity", "noContractions"),
						},
						{
							phrase: "the guy",
							translation: [artcl.words.el, noun.words.chico],
						},
					],
				},
				{
					id: 17,
					sentence: "We are the girls",
					translation: "SOMOS LAS CHICAS",
					data: [
						{
							phrase: "We are",
							translation: verb.words.ser.present.somos,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "the girls",
							translation: [artcl.words.las, asPlural(noun.words.chica)],
						},
					],
				},
				{
					id: 18,
					sentence: "We were friends(M)",
					translation: "ÉRAMOS AMIGOS",
					data: [
						{
							phrase: "We were",
							translation: verb.words.ser.past.eramos,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "friends(M)",
							translation: asPlural(noun.words.amigo),
						},
					],
				},
				{
					id: 19,
					sentence: "Are you here?",
					translation: "¿ESTÁS AQUÍ?",
					data: [
						{
							phrase: "Are you",
							translation: verb.words.estar.present.estas,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{
							phrase: "here",
							translation: advrb.words.aqui,
						},
					],
				},
				{
					id: 20,
					sentence: "Why aren't you here(formal)?",
					translation: "¿POR QUÉ NO ESTÁ AQUI?",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							reference: ref("porQueWhy"),
						},
						{
							phrase: "aren't you",
							translation: [advrb.words.no, verb.words.estar.present.estas],
							noPronoun: true,
							reference: ref(
								"estarHowAndWhere",
								"noContractions",
								"usted3rdPerson",
								"ustedNoPronoun"
							),
							isFormal: true,
						},
					],
				},
				{
					id: 21,
					sentence: "I'm the guy that found him",
					translation: "YO SOY EL CHICO QUE LO found",
					data: [
						{
							phrase: "I'm",
							translation: [pron.subject.words.yo, verb.words.ser.present.soy],
							reference: ref("serIdentity"),
						},
						{
							phrase: "the guy",
							translation: [artcl.words.el, noun.words.chico],
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "found him",
							translation: [pron.dObj.words.lo],
							phraseTranslation: "LO found",
							reference: ref("dObjPosition"),
						},
					],
				},
				{
					id: 22,
					sentence: "They are the girls that know you(F)",
					translation: "ELLAS SON LAS CHICAS QUE LA know",
					data: [
						{
							phrase: "They",
							translation: pron.subject.words.ellas,
						},
						{
							phrase: "are",
							translation: [verb.words.ser.present.son],
							reference: ref("serIdentity"),
						},
						{
							phrase: "the girls",
							translation: [artcl.words.las, asPlural(noun.words.chica)],
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "know you(F)",
							translation: [pron.dObj.words.la],
							phraseTranslation: "LA know",
							reference: ref(
								"dObjPosition",
								"ustedDirectObject",
								"usted3rdPerson"
							),
							isFormal: true,
						},
					],
				},
				{
					id: 23,
					sentence: "They(M) did it in order to be your friends(M)",
					translation: "ELLOS LO did PARA SER your AMIGOS",
					data: [
						{
							phrase: "They(M)",
							translation: pron.subject.words.ellos,
						},
						{
							phrase: "did it",
							translation: [pron.dObj.words.lo],
							phraseTranslation: "LO did",
							reference: ref("dObjPosition"),
						},
						{
							phrase: "in order to be",
							translation: [prep.words.para, verb.words.ser],
							reference: ref("paraSer", "serBeing", "serIdentity"),
						},
						{ phrase: "your" },
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
					],
				},
				{
					id: 24,
					sentence: "I was the friend(F)",
					translation: "YO ERA LA AMIGA",
					data: [
						{
							phrase: "I",
							translation: pron.subject.words.yo,
						},
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{
							phrase: "the friend(F)",
							translation: [artcl.words.la, noun.words.amiga],
						},
					],
				},
				{
					id: 25,
					sentence: "That's why I'm here",
					translation: "POR ESO ESTOY AQUÍ",
					data: [
						{
							phrase: "That's why",
							translation: [prep.words.por, pron.demonstrative.words.eso],
							reference: ref("porEso"),
						},
						{
							phrase: "I'm",
							translation: verb.words.estar.present.estoy,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 26,
					sentence: "Were you the boy?",
					translation: "¿ERAS TÚ EL CHICO?",
					data: [
						{
							phrase: "Were",
							translation: verb.words.ser.past.eras,
							reference: ref("serIdentity"),
						},
						{ phrase: "you", translation: pron.subject.words.tu },
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "boy", translation: noun.words.chico },
					],
				},
				{
					id: 27,
					sentence: "They(M) aren't my friends, but we(M) are.",
					translation: "ELLOS NO SON my AMIGOS, but NOSOTROS LO SOMOS",
					data: [
						{ phrase: "They(M)", translation: pron.subject.words.ellos },
						{
							phrase: "aren't",
							translation: [advrb.words.no, verb.words.ser.present.son],
							reference: ref("serIdentity", "noContractions"),
						},
						{ phrase: "my" },
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
						{ phrase: "but" },
						{ phrase: "we(M)", translation: pron.subject.words.nosotros },
						{
							phrase: "are",
							translation: [
								pron.attribute.words.lo,
								verb.words.ser.present.somos,
							],
							reference: ref("attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 28,
					sentence: "Why were they friends(F)",
					translation: "POR QUÉ ERAN ELLAS AMIGAS",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							reference: ref("porQueWhy"),
						},
						{
							phrase: "were",
							translation: verb.words.ser.past.eran,
							reference: ref("serIdentity"),
						},
						{ phrase: "they(F)", translation: pron.subject.words.ellas },
						{ phrase: "friends(F)", translation: asPlural(noun.words.amiga) },
					],
				},
				{
					id: 29,
					sentence: "She isn't my friend, but you are",
					translation: "ELLA NO ES my AMIGA, but TÚ LO ES",
					data: [
						{ phrase: "She", translation: pron.subject.words.ella },
						{
							phrase: "isn't",
							translation: [advrb.words.no, verb.words.ser.present.es],
							reference: ref("serIdentity", "noContractions"),
						},
						{ phrase: "my" },
						{ phrase: "friend(F)", translation: noun.words.amiga },
						{ phrase: "but" },
						{ phrase: "you", translation: pron.subject.words.tu },
						{
							phrase: "are",
							translation: [pron.attribute.words.lo, verb.words.ser.present.es],
							reference: ref("attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 30,
					sentence: "That's why they(M) found you(M)",
					translation: "POR ESO ELLOS LO found",
					data: [
						{
							phrase: "That's why",
							translation: [prep.words.por, pron.demonstrative.words.eso],
							reference: ref("porEso"),
						},
						{ phrase: "they(M)", translation: pron.subject.words.ellos },
						{
							phrase: "found you(M)",
							translation: [pron.dObj.words.lo],
							phraseTranslation: "LO found",
							reference: ref(
								"dObjPosition",
								"ustedDirectObject",
								"usted3rdPerson"
							),
							isFormal: true,
						},
					],
				},
				{
					id: 31,
					sentence: "I'm with the boys",
					translation: "ESTOY CON LOS CHICOS",
					data: [
						{
							phrase: "I'm",
							translation: verb.words.estar.present.estoy,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "with", translation: prep.words.con },
						{ phrase: "the", translation: artcl.words.los },
						{ phrase: "boys", translation: asPlural(noun.words.chico) },
					],
				},
				{
					id: 32,
					sentence: "We are here because of being friends(F)",
					translation: "ESTAMOS AQUÍ POR SER AMIGAS",
					data: [
						{
							phrase: "We are",
							translation: verb.words.estar.present.estamos,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{
							phrase: "being",
							translation: verb.words.ser,
							reference: ref("serBeing", "serIdentity"),
						},
						{ phrase: "friends(F)", translation: asPlural(noun.words.amiga) },
					],
				},
				{
					id: 33,
					sentence: "Being here is a good thing",
					translation: "ESTAR AQUÍ ES a good thing",
					data: [
						{
							phrase: "Being",
							translation: verb.words.estar,
							reference: ref("estarBeing", "estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "a good thing" },
					],
				},
				{
					id: 34,
					sentence: "So, she was the girl",
					translation: "So, ELLA ERA LA CHICA",
					data: [
						{ phrase: "So," },
						{ phrase: "she", translation: pron.subject.words.ella },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "girl", translation: noun.words.chica },
					],
				},
				{
					id: 35,
					sentence: "Are you with the girls?",
					translation: "ESTÁS CON LAS CHICAS?",
					data: [
						{
							phrase: "Are you",
							translation: verb.words.estar.present.estas,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "with", translation: prep.words.con },
						{ phrase: "the", translation: artcl.words.las },
						{ phrase: "girls", translation: asPlural(noun.words.chica) },
					],
				},
			],
		},
		{
			lesson: 23,
			name: "Lesson 23",
			details: "ESTAR's stabby past tense. And more nouns!",
			info: [
				"Before we learn the past tense conjugation of ESTAR, let's add some more NOUNS to our reperotoire.",
				"Unlike AMIGO/AMIGA(friend) which can change genders based on context, these nouns have fixed genders and must be used with the proper articles.",
				"CASA = House, and is always feminine. (La Casa = The Casa),",
				"LUGAR = Place, and is always masculine. (El Lugar = The Place)",
				"CASA is often used without an article, in phrases such as 'EN CASA' = 'AT HOME'",
				"Let's also learn the plural form of these words:",
				"CASAS = Houses/Homes (Las Casas = The Houses)",
				"LUGARES = Places (Los Lugares = The Places)",
				"Note: CASA is actually the most frequently used noun in Spanish, and LUGAR isn't far behind. Since they both are used to talk about locations we will use them a lot to practice ESTAR vs SER usage",
				"Now let's move to learning the past tense conjugation of ESTAR. Seems tricky to memorize all these verb forms, but the good news is as you start to pick up on these conjugation patterns things WILL get easier!",
				"I WAS = ESTABA, YOU WERE = ESTABAS, HE/SHE/IT WAS = ESTABA, WE WERE = ESTÁBAMOS, THEY WERE = ESTABAN",
				"You may already be noticing patterns that are simillar across SER and ESTAR and across the TENSE:",
				"Consider SERs 3rd person plural (THEY) present and past: SON and ERAN, and ESTARS 3rd person plural present and past: ESTÁN and ESTÁBAN",
				"These conjugations are all very different from each other, BUT they all end in the letter 'N' ",
				"Now consider SER's 2nd person (YOU) present and past: ERES and ESTÁS, and ESTAR's 2nd person (YOU) present and past: ESTÁS and ESTABAS",
				"These conjugations all end with the letter 'S'",
				"Here's two more quirks with ESTAR that don't really appear in English: ",
				"Remember with SER we used LO as an attribute to refer to a whole concept previously mentioned in the sentence, like: 'We aren't friends but they are' become 'We aren't friends but they LO are'",
				"The same thing can happen with ESTAR: 'We aren't at the house but they are' would be 'We aren't at the house but they LO ESTÁN",
				"The other quirk with ESTAR is something you actually can't do in English. ",
				"Consider the sentence: 'ELLOS NO ESTÁN', this is literally translated as 'They are not', but what it means in Spanish is: 'They are not around', or 'They are not present'",
				"The thing with this is: By default the verb ESTAR refers to location, so when it's used without any other information it defaults to referring to 'the idea of being in a location'",
				"In English we can't do this, because it's very vague to say simply: 'He isn't', or 'They aren't' without any context. But in Spanish ESTAR provides the context since it's the TO BE very speciically used for location stuff.",
				"This use of ESTAR doesn't have to mean just 'around here' it can mean 'around there' if it is clear what location you are talking about.",
				"For clarity in the quizzes, if we ask for HERE translate it as AQUÍ, but if we ask for PRESENT you can just use ESTAR without anything attached to it.",
			],
			wordBank: [
				noun.words.casa,
				noun.words.lugar,
				verb.words.estar.past.estaba,
				verb.words.estar.past.estabas,
				verb.words.estar.past.estabamos,
				verb.words.estar.past.estaban,
			],
			sentences: [
				{
					id: 1,
					sentence: "I was here",
					translation: "ESTABA AQUÍ",
					data: [
						{
							phrase: "I was",
							translation: verb.words.estar.past.estaba,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 2,
					sentence: "He was here",
					translation: "ESTABA AQUÍ",
					data: [
						{
							phrase: "He was",
							translation: verb.words.estar.past.estaba,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 3,
					sentence: "You were here",
					translation: "ESTABAS AQUÍ",
					data: [
						{
							phrase: "You were",
							translation: verb.words.estar.past.estabas,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 4,
					sentence: "We were here",
					translation: "ESTÁBAMOS AQUÍ",
					data: [
						{
							phrase: "We were",
							translation: verb.words.estar.past.estabamos,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 5,
					sentence: "They were here",
					translation: "ESTABAN AQUÍ",
					data: [
						{
							phrase: "They were",
							translation: verb.words.estar.past.estaban,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 6,
					sentence: "You are at the place",
					translation: "ESTÁS EN EL LUGAR",
					data: [
						{
							phrase: "You are",
							translation: verb.words.estar.present.estas,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "place", translation: noun.words.lugar },
					],
				},
				{
					id: 7,
					sentence: "You were at the house",
					translation: "ESTABAS EN LA CASA",
					data: [
						{
							phrase: "You were",
							translation: verb.words.estar.past.estabas,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "house", translation: noun.words.casa },
					],
				},
				{
					id: 8,
					sentence: "Were they at the house?",
					translation: "ESTABAN EN LA CASA?",
					data: [
						{
							phrase: "Were they",
							translation: verb.words.estar.past.estaban,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "house", translation: noun.words.casa },
					],
				},
				{
					id: 9,
					sentence: "We were at the places",
					translation: "ESTÁBAMOS EN LOS LUGARES",
					data: [
						{
							phrase: "We were",
							translation: verb.words.estar.past.estabamos,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.los },
						{ phrase: "places", translation: asPlural(noun.words.lugar) },
					],
				},
				{
					id: 10,
					sentence: "You are at the house",
					translation: "USTED ESTÁ EN LA CASA",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "are",
							translation: verb.words.estar.present.esta,
							reference: ref("estarHowAndWhere", "usted3rdPerson"),
							isFormal: true,
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "house", translation: noun.words.casa },
					],
				},
				{
					id: 11,
					sentence: "She was here",
					translation: "ESTABA AQUÍ",
					data: [
						{
							phrase: "She was",
							translation: verb.words.estar.past.estaba,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{
							phrase: "here",
							translation: advrb.words.aqui,
						},
					],
				},
				{
					id: 12,
					sentence: "I was in a house",
					translation: "ESTABA EN UNA CASA",
					data: [
						{
							phrase: "I was",
							translation: verb.words.estar.past.estaba,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{
							phrase: "in",
							translation: prep.words.en,
						},
						{
							phrase: "a",
							translation: artcl.words.una,
						},
						{
							phrase: "house",
							translation: noun.words.casa,
						},
					],
				},
				{
					id: 13,
					sentence: "I'm at a place",
					translation: "ESTOY EN UN LUGAR",
					data: [
						{
							phrase: "I'm",
							translation: verb.words.estar.present.estoy,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "a", translation: artcl.words.un },
						{ phrase: "place", translation: noun.words.lugar },
					],
				},
				{
					id: 14,
					sentence: "We aren't friends(M) but they(M) are",
					translation: "NOSOTROS NO SOMOS AMIGOS, but ELLOS LO SON",
					data: [
						{ phrase: "We(M)", translation: pron.subject.words.nosotros },
						{
							phrase: "aren't",
							translation: [advrb.words.no, verb.words.ser.present.somos],
							reference: ref("serIdentity", "noContractions"),
						},
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
						{ phrase: "but" },
						{ phrase: "they(M)", translation: pron.subject.words.ellos },
						{
							phrase: "are",
							translation: [
								pron.attribute.words.lo,
								verb.words.ser.present.son,
							],
							reference: ref("attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 15,
					sentence: "We(M) aren't at the house buy they(M) are",
					translation: "NOSOTROS NO ESTAMOS EN LA CASA, but ELLOS LO ESTÁN",
					data: [
						{ phrase: "We(M)", translation: pron.subject.words.nosotros },
						{
							phrase: "aren't",
							translation: [advrb.words.no, verb.words.estar.present.estamos],
							reference: ref("estarHowAndWhere", "noContractions"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "house", translation: noun.words.casa },
						{ phrase: "but" },
						{ phrase: "they(M)", translation: pron.subject.words.ellos },
						{
							phrase: "are",
							translation: [
								pron.attribute.words.lo,
								verb.words.estar.present.estan,
							],
							reference: ref("attributeLo", "estarHowAndWhere"),
						},
					],
				},
				{
					id: 16,
					sentence: "We weren't here, but now we are",
					translation: "NO ESTÁBAMOS AQUÍ, but now LO ESTAMOS",
					data: [
						{
							phrase: "We weren't",
							translation: [advrb.words.no, verb.words.estar.past.estabamos],
							noPronoun: true,
							reference: ref("estarHowAndWhere", "noContractions"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
						{ phrase: "but" },
						{ phrase: "now" },
						{
							phrase: "we are",
							translation: [
								pron.attribute.words.lo,
								verb.words.estar.present.estamos,
							],
							reference: ref("attributeLo", "estarHowAndWhere"),
						},
					],
				},
				{
					id: 17,
					sentence: "I wasn't in a house, you were",
					translation: "YO NO ESTABA EN UNA CASA, TÚ LO ESTABAS",
					data: [
						{
							phrase: "I",
							translation: pron.subject.words.yo,
						},
						{
							phrase: "wasn't",
							translation: [advrb.words.no, verb.words.estar.past.estaba],
							noPronoun: true,
							reference: ref("estarHowAndWhere", "noContractions"),
						},
						{
							phrase: "in",
							translation: prep.words.en,
						},
						{
							phrase: "a",
							translation: artcl.words.una,
						},
						{
							phrase: "house",
							translation: noun.words.casa,
						},
						{ phrase: "you", translation: pron.subject.words.tu },
						{
							phrase: "were",
							translation: [
								pron.attribute.words.lo,
								verb.words.estar.past.estabas,
							],
							reference: ref("attributeLo", "estarHowAndWhere"),
						},
					],
				},
				{
					id: 18,
					sentence: "Were you at the place? They(F) were",
					translation: "ESTABA USTED EN LUGAR? ELLAS LO ESTABAN",
					data: [
						{
							phrase: "Were you",
							translation: verb.words.estar.past.estaba,
							reference: ref("estarHowAndWhere", "usted3rdPerson"),
							isFormal: true,
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "place", translation: noun.words.lugar },
						{ phrase: "They(F)", translation: pron.subject.words.ellas },
						{
							phrase: "were",
							translation: [
								pron.attribute.words.lo,
								verb.words.estar.past.estaban,
							],
							reference: ref("attributeLo", "estarHowAndWhere"),
						},
					],
				},
				{
					id: 19,
					sentence: "Yes, I am present",
					translation: "Yes, YO ESTOY",
					data: [
						{ phrase: "Yes," },
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "am present",
							translation: verb.words.estar.present.estoy,
							reference: ref("estarHowAndWhere", "estarPresent"),
						},
					],
				},
				{
					id: 20,
					sentence: "They want to know if you are present",
					translation: "ELLOS want to know if ESTÁS",
					data: [
						{
							phrase: "They",
							translation: pron.subject.words.ellos,
						},
						{ phrase: "want to know" },
						{ phrase: "if" },
						{
							phrase: "you are present",
							translation: verb.words.estar.present.estas,
							reference: ref("estarHowAndWhere", "estarPresent"),
						},
					],
				},
				{
					id: 21,
					sentence: "The girl is not present",
					translation: "LA CHICA NO ESTÁ",
					data: [
						{
							phrase: "The girl",
							translation: [artcl.words.la, noun.words.chica],
						},
						{
							phrase: "is not present",
							translation: [advrb.words.no, verb.words.estar.present.esta],
							reference: ref(
								"estarHowAndWhere",
								"noVerbPosition",
								"estarPresent"
							),
						},
					],
				},
			],
		},
		{
			lesson: 24,
			name: "Lesson 24",
			details: "SER vs ESTAR review and practice",
			info: [
				"Keeping all the conjugations and tenses in one verb form is hard enough, now we have to do it with two verbs that mean arguably simillar things, ESTAR and SER both being different uses of 'To Be",
				"SER is TO BE in the sense of something/someones identity or origin, What they are, or where they're from.",
				"ESTAR is TO BE in the sense of location, Where something/someone is, or how they are (feeling, condition, etc)",
				"There's a useful three part process in determining the correct verb usage between SER and ESTAR:",
				"1. Decide if it's SER or ESTAR: Are we talking about WHAT something is, or WHERE it is/HOW it is?",
				"2. Decide the TENSE: Present, Past, Future, etc",
				"3. Decide the CONJUGATION: Who or what is the subject? I, You, He, She, It, We, They?",
				"You may see a sentence like: 'She was my friend' and be tempted to jump right into past tense of one of the verbs, but before that you need to be totally confident if you should be using SER or ESTAR.",
				"In this case we are talkig about 'WHAT' she was, so we know it's SER, then we see it's PAST tense, and finally we see the subject is 'SHE' so we use the 3rd person singular form of SER in the past tense: ERA",
				"Once you get the hang of this process it will become second nature to you, and you'll be able to quickly determine the correct verb form to use.",
				"Let's practice this process with some example sentences",
			],
			wordBank: [],
			sentences: [
				{
					id: 1,
					sentence: "You were the girl",
					translation: "ERAS LA CHICA",
					data: [
						{
							phrase: "You were",
							translation: verb.words.ser.past.eras,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "the",
							translation: artcl.words.la,
						},
						{ phrase: "girl", translation: noun.words.chica },
					],
				},
				{
					id: 2,
					sentence: "She was here",
					translation: "ELLA ESTABA AQUÍ",
					data: [
						{ phrase: "She", translation: pron.subject.words.ella },
						{
							phrase: "was",
							translation: verb.words.estar.past.estaba,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 3,
					sentence: "I was at the house",
					translation: "ESTABA EN LA CASA",
					data: [
						{
							phrase: "I was",
							translation: verb.words.estar.past.estaba,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "house", translation: noun.words.casa },
					],
				},
				{
					id: 4,
					sentence: "They were friends(F)",
					translation: "ERAN AMIGAS",
					data: [
						{
							phrase: "They were",
							translation: verb.words.ser.past.eran,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "friends(F)",
							translation: asPlural(noun.words.amiga),
						},
					],
				},
				{
					id: 5,
					sentence: "He was at a place",
					translation: "ESTABA EN UN LUGAR",
					data: [
						{
							phrase: "He was",
							translation: verb.words.estar.past.estaba,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "a", translation: artcl.words.un },
						{ phrase: "place", translation: noun.words.lugar },
					],
				},
				{
					id: 6,
					sentence: "We are here",
					translation: "ESTAMOS AQUÍ",
					data: [
						{
							phrase: "We are",
							translation: verb.words.estar.present.estamos,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{
							phrase: "here",
							translation: advrb.words.aqui,
						},
					],
				},
				{
					id: 7,
					sentence: "Were you at the place?",
					translation: "ESTABAS EN EL LUGAR?",
					data: [
						{
							phrase: "Were you",
							translation: verb.words.estar.past.estabas,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "place", translation: noun.words.lugar },
					],
				},
				{
					id: 8,
					sentence: "You were the guy",
					translation: "USTED ERA EL CHICO",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "were",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity", "usted3rdPerson"),
						},
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "guy", translation: noun.words.chico },
					],
				},
				{
					id: 9,
					sentence: "She was afriend",
					translation: "ELLA ERA UNA AMIGA",
					data: [
						{ phrase: "She", translation: pron.subject.words.ella },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "a", translation: artcl.words.una },
						{ phrase: "friend(F)", translation: noun.words.amiga },
					],
				},
				{
					id: 10,
					sentence: "We were here",
					translation: "ESTÁBAMOS AQUÍ",
					data: [
						{
							phrase: "We were",
							translation: verb.words.estar.past.estabamos,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 11,
					sentence: "We were the girls",
					translation: "ÉRAMOS LAS CHICAS",
					data: [
						{
							phrase: "We were",
							translation: verb.words.ser.past.eramos,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{ phrase: "the", translation: artcl.words.las },
						{ phrase: "girls", translation: asPlural(noun.words.chica) },
					],
				},
				{
					id: 12,
					sentence: "They guys are friends",
					translation: "LOS CHICOS SON AMIGOS",
					data: [
						{
							phrase: "The guys",
							translation: [artcl.words.los, noun.words.chico],
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
							reference: ref("serIdentity"),
						},
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
					],
				},
				{
					id: 13,
					sentence: "Are you here?",
					translation: "USTED ESTÁ AQUÍ?",
					data: [
						{
							phrase: "Are you",
							translation: [
								pron.subject.words.usted,
								verb.words.estar.present.esta,
							],
							reference: ref("estarHowAndWhere", "usted3rdPerson"),
							isFormal: true,
						},
						{
							phrase: "here",
							translation: advrb.words.aqui,
						},
					],
				},
				{
					id: 14,
					sentence: "We are not friends(M)",
					translation: "NO SOMOS AMIGOS",
					data: [
						{
							phrase: "We are not",
							translation: [advrb.words.no, verb.words.ser.present.somos],
							noPronoun: true,
							reference: ref("serIdentity", "noVerbPosition"),
						},
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
					],
				},
				{
					id: 15,
					sentence: "They were not at the place",
					translation: "NO ESTABAN EN EL LUGAR",
					data: [
						{
							phrase: "They were not",
							translation: [advrb.words.no, verb.words.estar.past.estaban],
							noPronoun: true,
							reference: ref("estarHowAndWhere", "noVerbPosition"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "place", translation: noun.words.lugar },
					],
				},
				{
					id: 16,
					sentence: "He is a friend",
					translation: "ES UN AMIGO",
					data: [
						{
							phrase: "He is",
							translation: verb.words.ser.present.es,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{ phrase: "a", translation: artcl.words.un },
						{ phrase: "friend(M)", translation: noun.words.amigo },
					],
				},
				{
					id: 17,
					sentence: "I was the girl",
					translation: "YO ERA LA CHICA",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "girl", translation: noun.words.chica },
					],
				},
				{
					id: 18,
					sentence: "I'm a guy",
					translation: "SOY UN CHICO",
					data: [
						{
							phrase: "I'm",
							translation: verb.words.ser.present.soy,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{ phrase: "a", translation: artcl.words.un },
						{ phrase: "guy", translation: noun.words.chico },
					],
				},
				{
					id: 19,
					sentence: "They are not here",
					translation: "NO ESTÁN AQUÍ",
					data: [
						{
							phrase: "They are not",
							translation: [advrb.words.no, verb.words.estar.present.estan],
							noPronoun: true,
							reference: ref("estarHowAndWhere", "noVerbPosition"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 20,
					sentence: "They are from Perú",
					translation: "SON DE Peru",
					data: [
						{
							phrase: "The are",
							translation: verb.words.ser.present.son,
							reference: ref("serOrigin"),
						},
						{
							phrase: "from",
							translation: prep.words.de,
							reference: ref("serOrigin"),
						},
						{ phrase: "Perú" },
					],
				},
				{
					id: 21,
					sentence: "Those books are by my favorite author",
					translation: "Those books SON POR my favorite author",
					data: [
						{ phrase: "Those books" },
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
							reference: ref("serOrigin", "serIdentity"),
						},
						{
							phrase: "by",
							translation: prep.words.por,
							reference: ref("porCauseBy"),
						},
						{
							phrase: "my favorite author",
						},
					],
				},
				{
					id: 22,
					sentence: "The problem was that she wasn't here",
					translation: "The problem ERA QUE ELLA NO ESTABA AQUÍ",
					data: [
						{ phrase: "The problem" },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "she", translation: pron.subject.words.ella },
						{
							phrase: "wasn't",
							translation: [advrb.words.no, verb.words.estar.past.estaba],
							noPronoun: true,
							reference: ref("estarHowAndWhere", "noContractions"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 23,
					sentence: "You weren't in this place, I was",
					translation: "USTED NO ESTABA EN this LUGAR, YO LO ESTABA",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "weren't",
							translation: [advrb.words.no, verb.words.estar.past.estaba],
							noPronoun: true,
							reference: ref(
								"estarHowAndWhere",
								"noContractions",
								"usted3rdPerson"
							),
						},
						{
							phrase: "in",
							translation: prep.words.en,
						},
						{ phrase: "this" },
						{ phrase: "place", translation: noun.words.lugar },
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "was",
							translation: [
								pron.attribute.words.lo,
								verb.words.estar.past.estaba,
							],
							reference: ref("attributeLo", "estarHowAndWhere"),
						},
					],
				},
				{
					id: 24,
					sentence: "Are you around here?",
					translation: "ESTÁS POR AQUÍ?",
					data: [
						{
							phrase: "Are you",
							translation: verb.words.estar.present.estas,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{
							phrase: "around",
							translation: prep.words.por,
							reference: ref("porLocation"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 25,
					sentence: "She wasn't a friend, I was",
					translation: "ELLA NO ERA UNA AMIGA, YO LO ERA",
					data: [
						{ phrase: "She", translation: pron.subject.words.ella },
						{
							phrase: "wasn't",
							translation: [advrb.words.no, verb.words.ser.past.era],
							noPronoun: true,
							reference: ref("serIdentity", "noContractions"),
						},
						{ phrase: "a", translation: artcl.words.una },
						{ phrase: "friend(F)", translation: noun.words.amiga },
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "was",
							translation: [pron.attribute.words.lo, verb.words.ser.past.era],
							reference: ref("attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 26,
					sentence: "He was here in order to be my friend",
					translation: "ESTABA AQUÍ PARA SER my AMIGO",
					data: [
						{
							phrase: "He was",
							translation: verb.words.estar.past.estaba,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
						{
							phrase: "in order",
							translation: prep.words.para,
							reference: ref("paraInOrder"),
						},
						{
							phrase: "to be",
							translation: verb.words.ser,
							reference: ref("serIdentity"),
						},
						{ phrase: "my" },
						{ phrase: "friend(M)", translation: noun.words.amigo },
					],
				},
				{
					id: 27,
					sentence: "Are you the girl's friend(F)",
					translation: "¿ERES LA AMIGA DE LA CHICA?",
					data: [
						{
							phrase: "Are you",
							translation: verb.words.ser.present.eres,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{
							phrase: "the",
						},
						{
							phrase: "girl's friend(F)",
							translation: [
								noun.words.amiga,
								prep.words.de,
								artcl.words.la,
								noun.words.chica,
							],
							reference: ref("dePossession"),
						},
					],
				},
				{
					id: 28,
					sentence: "She was around there?",
					translation: "¿ELLA ESTABA POR there?",
					data: [
						{ phrase: "She", translation: pron.subject.words.ella },
						{
							phrase: "was",
							translation: verb.words.estar.past.estaba,
							reference: ref("estarHowAndWhere"),
						},
						{
							phrase: "around",
							translation: prep.words.por,
							reference: ref("porLocation"),
						},
						{ phrase: "there" },
					],
				},
				{
					id: 29,
					sentence: "You are not the guy, he is.",
					translation: "USTED NO ES EL CHICO, ÉL LO ES.",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "are not",
							translation: [advrb.words.no, verb.words.ser.present.es],
							reference: ref("serIdentity", "noVerbPosition", "usted3rdPerson"),
						},
						{
							phrase: "the",
							translation: artcl.words.el,
						},
						{ phrase: "guy", translation: noun.words.chico },
						{ phrase: "he", translation: pron.subject.words.el },
						{
							phrase: "is",
							translation: [pron.attribute.words.lo, verb.words.ser.present.es],
							reference: ref("attributeLo", "serIdentity"),
						},
					],
				},
				{
					id: 30,
					sentence: "They knew we were not present",
					translation: "ELLOS knew QUE NO ESTÁBAMOS",
					data: [
						{
							phrase: "They knew we were not present",
							translation: [
								pron.subject.words.ellos,
								conj.words.que,
								advrb.words.no,
								verb.words.estar.past.estabamos,
							],
							reference: ref(
								"estarHowAndWhere",
								"queConnector",
								"noVerbPosition",
								"estarPresent"
							),
						},
					],
				},
				{
					id: 31,
					sentence: "We were from the same city",
					translation: "Éramos de the same city",
					data: [
						{
							phrase: "We were",
							translation: verb.words.ser.past.eramos,
							reference: ref("serOrigin", "serIdentity"),
							noPronoun: true,
						},
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "the same city" },
					],
				},
				{
					id: 32,
					sentence: "We are friends(M) because of being in the same class",
					translation: "SOMOS AMIGOS POR ESTAR EN the same class",
					data: [
						{
							phrase: "We are",
							translation: verb.words.ser.present.somos,
							reference: ref("serIdentity"),
							noPronoun: true,
						},
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{
							phrase: "being",
							translation: verb.words.estar,
							reference: ref("estarHowAndWhere", "estarBeing"),
						},
						{ phrase: "in", translation: prep.words.en },
						{ phrase: "the same class" },
					],
				},
				{
					id: 33,
					sentence: "That was because of my friend(F)",
					translation: "ESO ERA POR my AMIGA",
					data: [
						{ phrase: "That", translation: pron.subject.words.eso },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{ phrase: "my" },
						{ phrase: "friend(F)", translation: noun.words.amiga },
					],
				},
				{
					id: 34,
					sentence: "The problem is that you are not here",
					translation: "The problem ES QUE USTED NO ESTÁ AQUÍ",
					data: [
						{ phrase: "The problem" },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "you",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "are not",
							translation: [advrb.words.no, verb.words.estar.present.esta],
							reference: ref(
								"estarHowAndWhere",
								"noVerbPosition",
								"usted3rdPerson"
							),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 35,
					sentence: "They know we are present",
					translation: "ELLOS know QUE ESTAMOS",
					data: [
						{
							phrase: "They know we are present",
							translation: [
								pron.subject.words.ellos,
								conj.words.que,
								verb.words.estar.present.estamos,
							],
							reference: ref(
								"estarHowAndWhere",
								"queConnector",
								"estarPresent"
							),
						},
					],
				},
				{
					id: 36,
					sentence: "We are of flesh and bone",
					translation: "SOMOS DE flesh Y bone",
					data: [
						{
							phrase: "We are",
							translation: verb.words.ser.present.somos,
							reference: ref("serIdentity"),
							noPronoun: true,
						},
						{ phrase: "of", translation: prep.words.de },
						{ phrase: "flesh" },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "bone" },
					],
				},
				{
					id: 37,
					sentence: "The issue is that I'm not present",
					translation: "The issue ES QUE NO ESTOY",
					data: [
						{ phrase: "The issue" },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "I'm not present",
							translation: [advrb.words.no, verb.words.estar.present.estoy],
							reference: ref(
								"estarHowAndWhere",
								"noVerbPosition",
								"estarPresent"
							),
						},
					],
				},
				{
					id: 38,
					sentence: "Were they friends when they were in Bogotá?",
					translation: "¿ERAN AMIGOS when ESTABAN EN Bogotá?",
					data: [
						{
							phrase: "Were they",
							translation: verb.words.ser.past.eran,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
						{ phrase: "when" },
						{
							phrase: "they were",
							translation: verb.words.estar.past.estaban,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "in", translation: prep.words.en },
						{ phrase: "Bogotá" },
					],
				},
				{
					id: 39,
					sentence: "That is the girl's and it's for the guy?",
					translation: "¿ESO ES DE LA CHICA Y ES PARA EL CHICO?",
					data: [
						{ phrase: "That", translation: pron.subject.words.eso },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{
							phrase: "the girl's",
							translation: [prep.words.de, artcl.words.la, noun.words.chica],
							reference: ref("dePossession"),
						},
						{ phrase: "and", translation: conj.words.y },
						{
							phrase: "it's",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
							noPronoun: true,
						},
						{
							phrase: "for",
							translation: prep.words.para,
							reference: ref("paraFor"),
						},
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "guy", translation: noun.words.chico },
					],
				},
				{
					id: 40,
					sentence: "That is for the house",
					translation: "ESO ES PARA LA CASA",
					data: [
						{ phrase: "That", translation: pron.subject.words.eso },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{
							phrase: "for",
							translation: prep.words.para,
							reference: ref("paraFor"),
						},
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "house", translation: noun.words.casa },
					],
				},
				{
					id: 41,
					sentence: "You were my friend(M) because of being here",
					translation: "USTED ERA my AMIGO POR ESTAR AQUÍ",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "were",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity", "usted3rdPerson"),
						},
						{ phrase: "my" },
						{ phrase: "friend(M)", translation: noun.words.amigo },
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{
							phrase: "being",
							translation: verb.words.estar,
							reference: ref("estarHowAndWhere", "estarBeing"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 42,
					sentence: "You weren't present, but they(F) were",
					translation: "TÚ NO ESTABAS, but ELLAS LO ESTABAN",
					data: [
						{ phrase: "You", translation: pron.subject.words.tu },
						{
							phrase: "weren't",
							translation: [advrb.words.no, verb.words.estar.past.estabas],
							noPronoun: true,
							reference: ref(
								"estarHowAndWhere",
								"noContractions",
								"estarPresent"
							),
						},
						{ phrase: "but" },
						{ phrase: "they(F)", translation: pron.subject.words.ellas },
						{
							phrase: "were",
							translation: [
								pron.attribute.words.lo,
								verb.words.estar.past.estaban,
							],
							reference: ref("attributeLo", "estarHowAndWhere"),
						},
					],
				},
				{
					id: 43,
					sentence: "Were you the guy?",
					translation: "ERAS TÚ EL CHICO?",
					data: [
						{
							phrase: "Were",
							translation: verb.words.ser.past.eras,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{ phrase: "you", translation: pron.subject.words.tu },
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "guy", translation: noun.words.chico },
					],
				},
				{
					id: 44,
					sentence: "I'm a friend, and they(M) are with me",
					translation: "SOY UN AMIGO, Y ELLOS ESTÁN with me",
					data: [
						{
							phrase: "I'm",
							translation: verb.words.ser.present.soy,
							noPronoun: true,
							reference: ref("serIdentity"),
						},
						{ phrase: "a", translation: artcl.words.un },
						{ phrase: "friend(M)", translation: noun.words.amigo },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "they(M)", translation: pron.subject.words.ellos },
						{
							phrase: "are",
							translation: verb.words.estar.present.estan,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "with me" },
					],
				},
			],
		},
		{
			lesson: 25,
			name: "Lesson 25",
			details: "Full Course Review Quiz",
			info: [
				"This is just a review and practice of everything we've learned so far!",
				"Remember we are still using the word 'present' to denote the behoviour of ESTAR verbs to omit an actual location when saying something like 'She is present' = 'Ella está', since ESTAR implies location",
			],
			wordBank: [],
			sentences: [
				{
					id: 1,
					sentence: "What were you for those people?",
					translation: "QUÉ ERAS TÚ PARA those people?",
					data: [
						{ phrase: "What", translation: pron.interrogative.words.que },
						{
							phrase: "were you",
							translation: [verb.words.ser.past.eras, pron.subject.words.tu],
							reference: ref("serIdentity"),
						},
						{
							phrase: "for",
							translation: prep.words.para,
							reference: ref("paraFor"),
						},
						{ phrase: "those people" },
					],
				},
				{
					id: 2,
					sentence: "The boys were my friends",
					translation: "LOS CHICOS ERAN my AMIGOS",
					data: [
						{
							phrase: "The boys",
							translation: [artcl.words.los, asPlural(noun.words.chico)],
						},
						{
							phrase: "were",
							translation: verb.words.ser.past.eran,
							reference: ref("serIdentity"),
						},
						{ phrase: "my" },
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
					],
				},
				{
					id: 3,
					sentence: "We said that you are a friend(F)",
					translation: "We said QUE TÚ ERES UNA AMIGA",
					data: [
						{ phrase: "We(M)", translation: pron.subject.words.nosotros },
						{ phrase: "said" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "you", translation: pron.subject.words.tu },
						{
							phrase: "are",
							translation: verb.words.ser.present.eres,
							reference: ref("serIdentity"),
						},
						{ phrase: "a", translation: artcl.words.una },
						{ phrase: "friend(F)", translation: noun.words.amiga },
					],
				},
				{
					id: 4,
					sentence: "It has to be sent to the girl by this afternoon",
					translation: "It has to be sent A LA CHICA PARA this afternoon",
					data: [
						{ phrase: "It has to be sent" },
						{ phrase: "to", translation: prep.words.a },
						{
							phrase: "the girl",
							translation: [artcl.words.la, noun.words.chica],
						},
						{
							phrase: "by",
							translation: prep.words.para,
							reference: ref("paraDeadlines"),
						},
						{ phrase: "this afternoon" },
					],
				},
				{
					id: 5,
					sentence: "They were present at 6:00",
					translation: "ESTABAN A 6:00",
					data: [
						{
							phrase: "They were present",
							translation: verb.words.estar.past.estaban,
							noPronoun: true,
							reference: ref("estarHowAndWhere", "estarPresent"),
						},
						{
							phrase: "at",
							translation: prep.words.a,
							reference: ref("aAndTime"),
						},
						{ phrase: "6:00" },
					],
				},
				{
					id: 6,
					sentence: "I am the boy that found you",
					translation: "YO SOY EL CHICO QUE LO found",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "am",
							translation: verb.words.ser.present.soy,
							reference: ref("serIdentity"),
						},
						{
							phrase: "the boy",
							translation: [artcl.words.el, noun.words.chico],
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "found you",
							isFormal: true,
							translation: pron.attribute.words.lo,
							reference: ref(
								"dObjPosition",
								"usted3rdPerson",
								"ustedNoPronoun"
							),
							phraseTranslation: "LO found",
						},
					],
				},
				{
					id: 7,
					sentence: "I hope they(F) go along this path",
					translation: "I hope QUE ELLAS go POR this path",
					data: [
						{ phrase: "I" },
						{
							phrase: "hope they(F)",
							translation: [conj.words.que, pron.subject.words.ellas],
							phraseTranslation: "hope QUE ELLAS",
						},
						{ phrase: "go" },
						{
							phrase: "along",
							translation: prep.words.por,
							reference: ref("porAlong"),
						},
						{ phrase: "this path" },
					],
				},
				{
					id: 8,
					sentence: "You aren't the guy from the picture?",
					translation: "¿USTED NO ES EL CHICO DE the picture?",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{
							phrase: "aren't",
							translation: [advrb.words.no, verb.words.ser.present.es],
							reference: ref("serIdentity", "noContractions", "usted3rdPerson"),
						},
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "guy", translation: noun.words.chico },
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "the picture" },
					],
				},
				{
					id: 9,
					sentence: "We(M) are at the place and they(M) aren't",
					translation: "NOSOTROS ESTAMOS EN EL LUGAR Y ELLOS NO LO ESTÁN",
					data: [
						{ phrase: "We(M)", translation: pron.subject.words.nosotros },
						{
							phrase: "are",
							translation: verb.words.estar.present.estamos,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "place", translation: noun.words.lugar },
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "they(M)", translation: pron.subject.words.ellos },
						{
							phrase: "aren't",
							translation: [
								advrb.words.no,
								pron.attribute.words.lo,
								verb.words.estar.present.estan,
							],
							reference: ref(
								"attributeLo",
								"estarHowAndWhere",
								"noContractions"
							),
						},
					],
				},
				{
					id: 10,
					sentence: "We were the girls that saw them(F)",
					translation: "NOSOTRAS ÉRAMOS LAS CHICAS QUE LAS saw",
					data: [
						{ phrase: "We", translation: pron.subject.words.nosotras },
						{
							phrase: "were",
							translation: verb.words.ser.past.eramos,
							reference: ref("serIdentity"),
						},
						{
							phrase: "the girls",
							translation: [artcl.words.las, asPlural(noun.words.chica)],
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "saw them(F)",
							translation: [pron.attribute.words.las],
							reference: ref("dObjPosition"),
							phraseTranslation: "LAS saw",
						},
					],
				},
				{
					id: 11,
					sentence: "That is because of the book by this author",
					translation: "ESO ES POR the book POR this author",
					data: [
						{ phrase: "That", translation: pron.subject.words.eso },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{ phrase: "the book" },
						{
							phrase: "by",
							translation: prep.words.por,
							reference: ref("porCauseBy"),
						},
						{ phrase: "this author" },
					],
				},
				{
					id: 12,
					sentence: "You were on the stage",
					translation: "ESTABAS EN the stage",
					data: [
						{
							phrase: "You were",
							noPronoun: true,
							translation: verb.words.estar.past.estabas,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "on", translation: prep.words.en },
						{ phrase: "the stage" },
					],
				},
				{
					id: 13,
					sentence: "The problem is that he goes out of the house very late",
					translation: "The problem ES QUE he goes out DE LA CASA very late",
					data: [
						{ phrase: "The problem" },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "he", translation: pron.subject.words.el },
						{ phrase: "goes out" },
						{ phrase: "of", translation: prep.words.de },
						{
							phrase: "the house",
							translation: [artcl.words.la, noun.words.casa],
						},
						{ phrase: "very late" },
					],
				},
				{
					id: 14,
					sentence: "He is here but the girls aren't",
					translation: "ÉL ESTÁ AQUÍ but LAS CHICAS NO LO ESTÁN",
					data: [
						{ phrase: "He", translation: pron.subject.words.el },
						{
							phrase: "is",
							translation: verb.words.estar.present.esta,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
						{ phrase: "but" },
						{
							phrase: "the girls",
							translation: [artcl.words.las, asPlural(noun.words.chica)],
						},
						{
							phrase: "aren't",
							translation: [
								advrb.words.no,
								pron.attribute.words.lo,
								verb.words.estar.present.estan,
							],
							reference: ref(
								"attributeLo",
								"estarHowAndWhere",
								"noContractions"
							),
						},
					],
				},
				{
					id: 15,
					sentence: "I know you, you're my cousin's(F) godmother",
					translation: "YO TE know, ERES LA godmother DE my cousin",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "know you",
							phraseTranslation: "TE know",
							translation: pron.dObj.words.te,
							reference: ref("dObjPosition"),
						},
						{
							phrase: "you're",
							translation: verb.words.ser.present.eres,
							reference: ref("serIdentity"),
							noPronoun: true,
						},
						{
							phrase: "my cousin's(F) godmother",
							phraseTranslation: "LA godmother DE my cousin",
							translation: [artcl.words.la, prep.words.de],
							reference: ref("dePossession"),
						},
					],
				},
				{
					id: 16,
					sentence: "The house that is my mom's isn't around here",
					translation: "LA CASA QUE ES DE my mom NO ESTÁ POR AQUÍ",
					data: [
						{
							phrase: "The house",
							translation: [artcl.words.la, noun.words.casa],
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "is",
							translation: verb.words.ser.present.es,
							reference: ref("serIdentity"),
						},
						{
							phrase: "my mom's",
							translation: [prep.words.de],
							reference: ref("dePossession"),
							phraseTranslation: "DE my mom",
						},
						{
							phrase: "isn't",
							translation: [advrb.words.no, verb.words.estar.present.esta],
							reference: ref("estarHowAndWhere", "noContractions"),
							noPronoun: true,
						},
						{
							phrase: "around",
							translation: prep.words.por,
							reference: ref("porLocation"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 17,
					sentence: "You are from Lima too?",
					translation: "USTED ES DE Lima too?",
					data: [
						{
							phrase: "You",
							isFormal: true,
							translation: pron.subject.words.usted,
						},
						{
							phrase: "are",
							translation: verb.words.ser.present.es,
							reference: ref("serOrigin", "usted3rdPerson"),
						},
						{ phrase: "from", translation: prep.words.de },
						{ phrase: "Lima too?" },
					],
				},
				{
					id: 18,
					sentence: "I know them(M) because of being here",
					translation: "YO LOS know POR ESTAR AQUÍ",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "know them(M)",
							translation: pron.dObj.words.los,
							reference: ref("dObjPosition"),
							phraseTranslation: "LOS know",
						},
						{
							phrase: "because of",
							translation: prep.words.por,
							reference: ref("porBecauseOf"),
						},
						{
							phrase: "being",
							translation: verb.words.estar,
							reference: ref("estarHowAndWhere", "estarBeing"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 19,
					sentence: "She knows me better than that",
					translation: "ELLA ME knows better QUE ESO",

					data: [
						{ phrase: "She", translation: pron.subject.words.ella },
						{
							phrase: "knows me",
							translation: pron.dObj.words.me,
							reference: ref("dObjPosition"),
							phraseTranslation: "ME knows",
						},
						{ phrase: "better" },
						{
							phrase: "than",
							translation: conj.words.que,
							reference: ref("queAsThan"),
						},
						{ phrase: "that", translation: pron.subject.words.eso },
					],
				},
				{
					id: 20,
					sentence: "Why? So that she doesn't meet her?",
					translation: "POR QUÉ? PARA QUE ELLA NO LA meets?",
					data: [
						{
							phrase: "Why?",
							translation: [prep.words.por, pron.interrogative.words.que],
							phraseTranslation: "POR QUÉ?",
						},
						{
							phrase: "So that",
							translation: [prep.words.para, conj.words.que],
							phraseTranslation: "PARA QUE",
							reference: ref("paraQueConj"),
						},
						{ phrase: "she", translation: pron.subject.words.ella },
						{
							phrase: "doesn't meet her?",
							translation: [advrb.words.no, pron.dObj.words.la],
							reference: ref("dObjPosition", "noContractions"),
							phraseTranslation: "NO LA meets?",
						},
					],
				},
				{
					id: 21,
					sentence: "You and I are friends(M)",
					translation: "USTED Y YO SOMOS AMIGOS",
					data: [
						{
							phrase: "You",
							translation: pron.subject.words.usted,
							isFormal: true,
						},
						{ phrase: "and", translation: conj.words.y },
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "are",
							translation: verb.words.ser.present.somos,
							reference: ref("serIdentity"),
						},
						{ phrase: "friends(M)", translation: asPlural(noun.words.amigo) },
					],
				},
				{
					id: 22,
					sentence: "Are you with a boy?",
					translation: "ESTÁS CON UN CHICO?",
					data: [
						{
							phrase: "Are you",
							translation: verb.words.estar.present.estas,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "with", translation: prep.words.con },
						{ phrase: "a", translation: artcl.words.un },
						{ phrase: "boy", translation: noun.words.chico },
					],
				},
				{
					id: 23,
					sentence: "What is this place for?",
					translation: "¿PARA QUÉ ES this LUGAR?",
					data: [
						{
							phrase: "What is this place for?",
							phraseTranslation: "¿PARA QUÉ ES this LUGAR?",
							translation: [
								prep.words.para,
								pron.interrogative.words.que,
								verb.words.ser.present.es,
								noun.words.lugar,
							],
							reference: ref(
								"paraFor",
								"paraQuePron",
								"serIdentity",
								"prepPosition"
							),
						},
					],
				},
				{
					id: 24,
					sentence: "They(M) are the friends(M) that know him.",
					translation: "ELLOS SON LOS AMIGOS QUE LO know.",
					data: [
						{ phrase: "They(M)", translation: pron.subject.words.ellos },
						{
							phrase: "are",
							translation: verb.words.ser.present.son,
							reference: ref("serIdentity"),
						},
						{
							phrase: "the friends(M)",
							translation: [artcl.words.los, asPlural(noun.words.amigo)],
						},
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "know him.",
							translation: pron.attribute.words.lo,
							reference: ref("dObjPosition"),
							phraseTranslation: "LO know.",
						},
					],
				},
				{
					id: 25,
					sentence: "I kept seeing you(F) for several years",
					translation: "YO LA kept seeing POR several years",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "kept seeing you(F)",
							isFormal: true,
							translation: pron.dObj.words.la,
							reference: ref(
								"dObjPosition",
								"usted3rdPerson",
								"ustedDirectObject"
							),
							phraseTranslation: "LA kept seeing",
						},
						{
							phrase: "for",
							translation: prep.words.por,
							reference: ref("porFor"),
						},
						{ phrase: "several years" },
					],
				},
				{
					id: 26,
					sentence: "I was the tallest(M) when we were in school",
					translation: "YO ERA EL tallest when ESTÁBAMOS EN school",
					data: [
						{ phrase: "I", translation: pron.subject.words.yo },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "tallest(M)" },
						{ phrase: "when" },
						{
							phrase: "we were",
							translation: verb.words.estar.past.estabamos,
							noPronoun: true,
							reference: ref("estarHowAndWhere"),
						},
						{ phrase: "in", translation: prep.words.en },
						{ phrase: "school" },
					],
				},
				{
					id: 27,
					sentence: "Why was she the friend?",
					translation: "POR QUÉ ERA ELLA LA AMIGA?",
					data: [
						{
							phrase: "Why",
							translation: [prep.words.por, pron.interrogative.words.que],
							phraseTranslation: "POR QUÉ",
						},
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "she", translation: pron.subject.words.ella },
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "friend", translation: noun.words.amiga },
					],
				},
				{
					id: 28,
					sentence: "How silly that we have three!",
					translation: "QUÉ silly QUE we have three!",
					data: [
						{
							phrase: "How silly",
							translation: pron.interrogative.words.que,
							phraseTranslation: "QUÉ silly",
							reference: ref("queExclamation"),
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "we have three" },
					],
				},
				{
					id: 29,
					sentence: "The problem was that she wasn't present",
					translation: "The problem ERA QUE ELLA NO ESTABA",
					data: [
						{ phrase: "The problem" },
						{
							phrase: "was",
							translation: verb.words.ser.past.era,
							reference: ref("serIdentity"),
						},
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "she", translation: pron.subject.words.ella },
						{
							phrase: "wasn't present",
							translation: [advrb.words.no, verb.words.estar.past.estaba],
							reference: ref(
								"estarHowAndWhere",
								"noContractions",
								"estarPresent"
							),
						},
					],
				},
				{
					id: 30,
					sentence: "I wasn't here but now I am",
					translation: "NO ESTABA AQUÍ, but now LO ESTOY",
					data: [
						{
							phrase: "I wasn't",
							translation: [advrb.words.no, verb.words.estar.past.estaba],
							noPronoun: true,
							reference: ref("estarHowAndWhere", "noContractions"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
						{ phrase: "but" },
						{ phrase: "now" },
						{
							phrase: "I am",
							translation: [
								pron.attribute.words.lo,
								verb.words.estar.present.estoy,
							],
							reference: ref("attributeLo", "estarHowAndWhere"),
							phraseTranslation: "LO ESTOY",
						},
					],
				},
				{
					id: 31,
					sentence: "Being a bank teller is hard, that's why I quit",
					translation: "SER bank teller is hard, POR ESO I quit",
					data: [
						{
							phrase: "Being a bank teller",
							phraseTranslation: "SER bank teller",
							translation: verb.words.ser,
							reference: ref("serIdentity", "serProfession"),
						},
						{ phrase: "is hard" },
						{
							phrase: "that's why",
							translation: [prep.words.por, pron.subject.words.eso],
							phraseTranslation: "POR ESO",
							reference: ref("porEso"),
						},
						{ phrase: "I quit" },
					],
				},
			],
		},
		{
			lesson: 26,
			name: "Lesson 26",
			details: "How to use SUBJUNCTIVES in Spanish",
			info: [
				"Subjunctives are some of the most important Verb Conjugations for expressing Abstract Ideas in Spanish",
				"They initimidate a lot of people, BUT they're are actually not that hard if you learn the most common sentence templates that use them!",
				"In fact, we are already familliar with some of these sentence templates.",
				"In Lesson 11: We discussed expressing abstract concepts in Spanish, such as intentions or reactions, using QUE phrases, such as 'I'd prefer QUE they do it by this afternoon'",
				"We've already learned the present and past forms of SER and ESTAR now we will add to that the Subjunctives:",
				"Subjunctives mean something like 'be' as in 'I be' 'he be' etc. and are typically used to express intention",
				"Intention means we 'want something to be the case' We aren't necessarilly saying it IS or ISN'T the case, but expressing an intention that 'it be the case'",
				"We actually do use the subjunctive in English, but nearly as often as it occurs in Spanish. Here's an English example: 'I recommend that you be his friend'",
				"For SER the Subjunctive conjugations are: SEA = 'I be', SEAS = 'you be', SEA = 'he/she/it be', SEAMOS = 'we be', SEAN = 'they be'",
				"While this usage isn't common in English, in Spanish it happens pretty much any time you indicate one person's intention for another person",
				"Example: 'I hope that she be our friend' = 'I hope QUE ELLA SEA our friend'. In English this would simply use: 'I hope that she is' but in Spanish the verb Hope indicated some sort of intention, so the second part of the sentence(clause) after QUE is going to be subjunctive",
				"There are some situations that trigger the subjunctive use: in technical terms you can expect this to happen anytime there are two clauses/sentence parts connected by QUE where an intention is being expressed in the first clause about what's happening in the second clause.",
				"In the above example, 'I hope' in the first clause indicates intention towards the second clause 'she be our friend'",
				"Some other verbs that oftern trigger subjunctives and indicate intention are: 'Hope', 'Recommend' 'Wish' 'Ask' or 'Desire' ",
				"Now let's learn the Subjunctives for ESTAR which are all pretty easy as they retain the same stressed syllable sounding like 'STAY'",
				"ESTÉ = 'I be', ESTÉS = 'you be', ESTÉ = 'he/she/it be', ESTÉMOS = 'we be', ESTÉN = 'they be'",
				"In English there's another sentence structure that expresses intention: 'We want you to be a doctor' but this sentence structure doesn't work in Spanish",
				"This would appear that the 'To be' should simply be SER, as in 'We want you SER a doctor', but in Spanish we would really phrase this as: 'We want that you be a doctor' = 'We want QUE SEAS doctor",
				"For example, here are two versions of the same English Sentence: 'I hope that he is a doctor' 'I hope for him to become a doctor'",
				"In Spanish both of these versions are simplified into 'I hope QUE ÉL SEA doctor",
				"Another example of translating English to Spanish is: 'My parents want me to be a good student' = 'My parents what THAT I BE a good student' = 'My parents want QUE YO SEA a good student'",
				"Just remember that you can't say things like 'Him to be' or 'you to be' in Spanish, you would say 'That he be' or 'that you be'",
				"This quiz will start simple to cover these concepts in isolation, watch out for differences in sentences that use subjunctive and don't",
			],
			wordBank: [
				verb.words.ser.subjunctive.seas,
				verb.words.ser.subjunctive.sea,
				verb.words.ser.subjunctive.seamos,
				verb.words.ser.subjunctive.sean,
				verb.words.estar.subjunctive.este,
				verb.words.estar.subjunctive.estes,
				verb.words.estar.subjunctive.estemos,
				verb.words.estar.subjunctive.esten,
			],

			sentences: [
				{
					id: 1,
					sentence: "I recommend that you be his teacher",
					translation: "I recommend QUE SEAS his teacher",
					data: [
						{ phrase: "I recommend" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "you be",
							translation: verb.words.ser.subjunctive.seas,
							reference: ref("serIdentity", "subjunctiveIntentionQue"),
						},
						{ phrase: "his teacher" },
					],
				},
				{
					id: 2,
					sentence: "I ask that she be my friend",
					translation: "I ask QUE ELLA SEA my AMIGA",
					data: [
						{ phrase: "I ask" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "she be", translation: verb.words.ser.subjunctive.sea },
						{ phrase: "my" },
						{ phrase: "friend", translation: noun.words.amiga },
					],
				},
				{
					id: 3,
					sentence: "You see that he is not your student",
					translation: "You see QUE ÉL NO ES your student",
					data: [
						{ phrase: "You see" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "he is not",
							translation: [
								pron.subject.words.el,
								advrb.words.no,
								verb.words.ser.present.es,
							],
							reference: ref("serIdentity", "noSubjunctive", "noVerbPosition"),
						},
						{ phrase: "your student" },
					],
				},
				{
					id: 4,
					sentence: "They intend that we be students",
					translation: "They intend QUE SEAMOS students",
					data: [
						{ phrase: "They intend" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "we be",
							translation: verb.words.ser.subjunctive.seamos,
							reference: ref("serIdentity", "subjunctiveIntentionQue"),
						},
						{ phrase: "students" },
					],
				},
				{
					id: 5,
					sentence: "He hopes that she is the winner",
					translation: "ÉL hopes QUE ELLA SEA LA winner",
					data: [
						{ phrase: "He", translation: pron.subject.words.el },
						{ phrase: "hopes" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "she is",
							translation: verb.words.ser.subjunctive.sea,
							reference: ref("serIdentity", "subjunctiveNoBe"),
						},
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "winner" },
					],
				},
				{
					id: 6,
					sentence: "I recommend that you be here",
					translation: "I recommend QUE ESTÉS AQUÍ",
					data: [
						{ phrase: "I recommend" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "you be",
							translation: verb.words.estar.subjunctive.estes,
							reference: ref("estarHowAndWhere", "subjunctiveIntentionQue"),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 7,
					sentence: "I hope that she is at the house",
					translation: "I hope QUE ELLA ESTÉ EN LA CASA",
					data: [
						{ phrase: "I hope" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "she is",
							translation: verb.words.estar.subjunctive.este,
							reference: ref("estarHowAndWhere", "subjunctiveNoBe"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "house", translation: noun.words.casa },
					],
				},
				{
					id: 8,
					sentence: "I want the boys to be friends",
					translation: "I want QUE LOS CHICOS SEAN AMIGOS",
					data: [
						{ phrase: "I" },
						{
							phrase: "want the boys to be",
							phraseTranslation: "want QUE LOS CHICOS SEAN",
							translation: [
								conj.words.que,
								artcl.words.los,
								asPlural(noun.words.chico),
								verb.words.ser.subjunctive.sean,
							],
							reference: ref(
								"serIdentity",
								"queWithSubjunctive",
								"subjunctiveIntentionQue"
							),
						},
						{ phrase: "friends", translation: asPlural(noun.words.amigo) },
					],
				},
				{
					id: 9,
					sentence: "I want him to be here",
					translation: "I want QUE ÉL ESTÉ AQUÍ",
					data: [
						{ phrase: "I" },
						{
							phrase: "want him to be",
							phraseTranslation: "want QUE ÉL ESTÉ",
							translation: [
								conj.words.que,
								pron.subject.words.el,
								verb.words.estar.subjunctive.este,
							],
							reference: ref(
								"estarHowAndWhere",
								"queWithSubjunctive",
								"subjunctiveIntentionQue"
							),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 10,
					sentence: "They want me to be a lawyer",
					translation: "They want QUE YO SEA lawyer",
					data: [
						{ phrase: "They" },
						{
							phrase: "want me to be",
							phraseTranslation: "want QUE YO SEA",
							translation: [
								conj.words.que,
								pron.subject.words.yo,
								verb.words.ser.subjunctive.sea,
							],
							reference: ref(
								"serIdentity",
								"queWithSubjunctive",
								"subjunctiveIntentionQue"
							),
						},
						{ phrase: "lawyer" },
					],
				},
				{
					id: 11,
					sentence: "I want you to be my teacher",
					translation: "I want QUE USTED SEA my teacher",
					data: [
						{ phrase: "I" },
						{
							phrase: "want you to be",
							phraseTranslation: "want QUE USTED SEA",
							translation: [
								conj.words.que,
								pron.subject.words.usted,
								verb.words.ser.subjunctive.sea,
							],
							reference: ref(
								"serIdentity",
								"queWithSubjunctive",
								"subjunctiveIntentionQue",
								"usted3rdPerson"
							),
							isFormal: true,
						},
						{ phrase: "my" },
						{ phrase: "teacher" },
					],
				},
				{
					id: 12,
					sentence: "I want you to be here",
					translation: "I want QUE ESTÉ AQUÍ",
					data: [
						{ phrase: "I" },
						{
							phrase: "want you to be",
							phraseTranslation: "want QUE ESTÉ",
							translation: [conj.words.que, verb.words.estar.subjunctive.este],
							reference: ref(
								"estarHowAndWhere",
								"queWithSubjunctive",
								"subjunctiveIntentionQue"
							),
						},
						{
							phrase: "here",
							translation: advrb.words.aqui,
						},
					],
				},
				{
					id: 13,
					sentence: "We(M) don't want them to be at the place",
					translation: "NOSOTROS NO want QUE ESTÉN EN EL LUGAR",
					data: [
						{ phrase: "We(M)", translation: pron.subject.words.nosotros },
						{
							phrase: "don't want them to be",
							translation: [
								advrb.words.no,
								conj.words.que,
								verb.words.estar.subjunctive.esten,
							],
							phraseTranslation: "NO want QUE ESTÉN",
							reference: ref(
								"estarHowAndWhere",
								"queWithSubjunctive",
								"subjunctiveIntentionQue"
							),
							noPronoun: true,
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "place", translation: noun.words.lugar },
					],
				},
				{
					id: 14,
					sentence: "We want you to be a doctor",
					translation: "We want QUE SEAS doctor",
					data: [
						{ phrase: "We" },
						{
							phrase: "want you to be",
							phraseTranslation: "want QUE SEAS",
							translation: [conj.words.que, verb.words.ser.subjunctive.seas],
							reference: ref(
								"serIdentity",
								"queWithSubjunctive",
								"subjunctiveIntentionQue"
							),
							noPronoun: true,
						},
						{ phrase: "doctor" },
					],
				},
				{
					id: 15,
					sentence: "I ask that she be my friend",
					translation: "I ask QUE ELLA SEA my AMIGA",
					data: [
						{ phrase: "I ask" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "she be",
							translation: verb.words.ser.subjunctive.sea,
							reference: ref("serIdentity", "subjunctiveIntentionQue"),
						},
						{ phrase: "my" },
						{ phrase: "friend", translation: noun.words.amiga },
					],
				},
				{
					id: 16,
					sentence: "I hope that they(M) are at the house",
					translation: "I hope QUE ELLOS ESTÉN EN LA CASA",
					data: [
						{ phrase: "I" },
						{
							phrase: "hope that they(M) are",
							phraseTranslation: "hope QUE ELLOS ESTÉN",
							translation: [
								conj.words.que,
								pron.subject.words.ellos,
								verb.words.estar.subjunctive.esten,
							],
							reference: ref(
								"estarHowAndWhere",
								"queWithSubjunctive",
								"subjunctiveNoBe"
							),
						},
						{ phrase: "at", translation: prep.words.en },
						{
							phrase: "the house",
							translation: [artcl.words.la, noun.words.casa],
						},
					],
				},
				{
					id: 17,
					sentence: "He hopes that she is the winner",
					translation: "ÉL hopes QUE ELLA SEA LA winner",
					data: [
						{ phrase: "He", translation: pron.subject.words.el },
						{ phrase: "hopes" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "she is",
							translation: verb.words.ser.subjunctive.sea,
							reference: ref("serIdentity", "subjunctiveNoBe"),
						},
						{ phrase: "the", translation: artcl.words.la },
						{ phrase: "winner" },
					],
				},
				{
					id: 18,
					sentence: "I want him to be here",
					translation: "I want QUE ÉL ESTÉ AQUÍ",
					data: [
						{ phrase: "I" },
						{
							phrase: "want him to be",
							phraseTranslation: "want QUE ÉL ESTÉ",
							translation: [
								conj.words.que,
								pron.subject.words.el,
								verb.words.estar.subjunctive.este,
							],
							reference: ref(
								"estarHowAndWhere",
								"queWithSubjunctive",
								"subjunctiveIntentionQue"
							),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 19,
					sentence: "She knows that we were friends(F)",
					translation: "She knows QUE ÉRAMOS AMIGAS",
					data: [
						{ phrase: "She knows" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "we were",
							translation: verb.words.ser.past.eramos,
							reference: ref("serIdentity", "noSubjunctive"),
							noPronoun: true,
						},
						{ phrase: "friends(F)", translation: asPlural(noun.words.amiga) },
					],
				},
				{
					id: 20,
					sentence: "I think that they are in school",
					translation: "I think QUE ESTÁN EN school",
					data: [
						{ phrase: "I think" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "they are",
							translation: verb.words.estar.present.estan,
							reference: ref("estarHowAndWhere", "noSubjunctive"),
							noPronoun: true,
						},
						{ phrase: "in", translation: prep.words.en },
						{ phrase: "school" },
					],
				},
				{
					id: 21,
					sentence: "She asks that they(F) be good students",
					translation: "She asks QUE ELLAS SEAN good students",
					data: [
						{ phrase: "She asks" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "they(F)", translation: pron.subject.words.ellas },
						{
							phrase: "be",
							translation: verb.words.ser.subjunctive.sean,
							reference: ref("serIdentity", "subjunctiveIntentionQue"),
						},
						{ phrase: "good students" },
					],
				},
				{
					id: 22,
					sentence: "You see that he is not your student",
					translation: "You see QUE ÉL NO ES your student",
					data: [
						{ phrase: "You see" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "he" },
						{
							phrase: "is not",
							translation: [advrb.words.no, verb.words.ser.present.es],
							reference: ref("serIdentity", "noSubjunctive", "noVerbPosition"),
						},
						{ phrase: "your student" },
					],
				},
				{
					id: 23,
					sentence: "I want you to be here",
					translation: "I want QUE ESTÉS AQUÍ",
					data: [
						{ phrase: "I" },
						{
							phrase: "want you to be",
							phraseTranslation: "want QUE ESTÉS",
							translation: [conj.words.que, verb.words.estar.subjunctive.estes],
							reference: ref(
								"estarHowAndWhere",
								"queWithSubjunctive",
								"subjunctiveIntentionQue"
							),
						},
						{ phrase: "here", translation: advrb.words.aqui },
					],
				},
				{
					id: 24,
					sentence: "I want you to be my teacher",
					translation: "I want QUE USTED SEA my teacher",
					data: [
						{ phrase: "I" },
						{
							phrase: "want you to be",
							phraseTranslation: "want QUE USTED SEA",
							translation: [
								conj.words.que,
								pron.subject.words.usted,
								verb.words.ser.subjunctive.sea,
							],
							reference: ref(
								"serIdentity",
								"queWithSubjunctive",
								"subjunctiveIntentionQue",
								"usted3rdPerson"
							),
							isFormal: true,
						},
						{ phrase: "my" },
						{ phrase: "teacher" },
					],
				},
				{
					id: 25,
					sentence: "I saw he was here",
					translation: "I saw QUE ÉL ESTABA AQUÍ",
					data: [
						{ phrase: "I" },
						{
							phrase: "saw he was",
							phraseTranslation: "saw QUE ÉL ESTABA",
							translation: [
								conj.words.que,
								pron.subject.words.el,
								verb.words.estar.past.estaba,
							],
							reference: ref("estarHowAndWhere", "noSubjunctive"),
						},
						{
							phrase: "here",
							translation: advrb.words.aqui,
						},
					],
				},
				{
					id: 26,
					sentence: "I think that they are my friends",
					translation: "I think QUE SON my AMIGOS",
					data: [
						{ phrase: "I think" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "they are",
							translation: verb.words.ser.present.son,
							reference: ref("serIdentity", "noSubjunctive"),
							noPronoun: true,
						},
						{ phrase: "my" },
						{ phrase: "friends", translation: asPlural(noun.words.amigo) },
					],
				},
				{
					id: 27,
					sentence: "He hopes that we are at the place",
					translation: "He hopes QUE ESTEMOS EN EL LUGAR",
					data: [
						{ phrase: "He" },
						{ phrase: "hopes" },
						{ phrase: "that", translation: conj.words.que },
						{
							phrase: "we are",
							translation: verb.words.estar.subjunctive.estemos,
							reference: ref("estarHowAndWhere", "subjunctiveIntentionQue"),
						},
						{ phrase: "at", translation: prep.words.en },
						{ phrase: "the", translation: artcl.words.el },
						{ phrase: "place", translation: noun.words.lugar },
					],
				},
				{
					id: 28,
					sentence: "I know that you are my friend(M)",
					translation: "I know QUE TÚ ERES my AMIGO",
					data: [
						{ phrase: "I know" },
						{ phrase: "that", translation: conj.words.que },
						{ phrase: "you", translation: pron.subject.words.tu },
						{
							phrase: "are",
							translation: verb.words.ser.present.eres,
							reference: ref("serIdentity", "noSubjunctive"),
						},
						{ phrase: "my" },
						{ phrase: "friend(M)", translation: noun.words.amigo },
					],
				},
			],
		},
	],
}

export default spanishData
