// =============================================================
// SAMPLE IELTS ACADEMIC READING TEST
// Topic: The Science of Sleep
// 3 Passages, 40 Questions, covering all 9 question types
// =============================================================

export const SAMPLE_TEST = {
  title: "IELTS Academic Reading – Practice Test 1",
  timeLimit: 60,       // minutes
  passages: [

    // ── PASSAGE 1 ─────────────────────────────────────────────
    {
      id: "p1",
      title: "The Science of Sleep",
      source: "Adapted from Sleep Research Society Bulletin, Vol. 12",
      paragraphs: [
        { label: "A", text: "Sleep is one of the most fundamental biological processes shared across the animal kingdom. From the simplest invertebrates to the most complex mammals, virtually every organism with a nervous system exhibits some form of rest behaviour. Despite being a universal experience, sleep remained poorly understood for most of human history, with researchers only beginning to systematically investigate its mechanisms and functions in the mid-twentieth century." },
        { label: "B", text: "The discovery of rapid eye movement (REM) sleep in 1953 by Eugene Aserinsky and Nathaniel Kleitman at the University of Chicago marked a watershed moment in sleep science. Using electroencephalograph (EEG) technology, the researchers were able to identify distinct stages of sleep characterised by different patterns of brain activity. They discovered that during REM sleep, the brain exhibits electrical activity remarkably similar to that of the waking state, yet the body remains almost entirely paralysed — a condition now known as muscle atonia." },
        { label: "C", text: "Sleep is now understood to be structured in cycles, each lasting approximately 90 minutes. A typical night's sleep consists of four to six such cycles. Each cycle progresses through several stages: three stages of non-REM (NREM) sleep, followed by a period of REM sleep. The initial stages of NREM sleep are characterised by slowing brain activity and reduced awareness of the environment. The deepest stage, often called slow-wave sleep, is associated with physical restoration, immune function, and the consolidation of declarative memories — that is, memories of facts and events." },
        { label: "D", text: "REM sleep, which grows longer with each successive cycle throughout the night, serves a different set of functions. Research suggests that it plays a crucial role in emotional regulation, creativity, and the processing of procedural memories — skills and habits. During REM sleep, the brain actively replays and reorganises experiences from the day, a process thought to facilitate learning. Studies using functional neuroimaging have shown that regions of the brain involved in emotion and memory, such as the amygdala and hippocampus, are particularly active during this stage." },
        { label: "E", text: "The internal clock that governs our sleep-wake cycle is known as the circadian rhythm. Housed primarily in a region of the brain called the suprachiasmatic nucleus (SCN), this biological clock operates on an approximately 24-hour cycle. It synchronises the body's physiological processes — including hormone secretion, body temperature regulation, and digestion — with the external environment. Light is the primary environmental cue, or zeitgeber, that resets the circadian clock each day. Exposure to bright light, particularly blue-spectrum light, suppresses the production of melatonin, the hormone that promotes sleep onset." },
        { label: "F", text: "Modern lifestyles have placed increasing pressure on sleep, with consequences that extend well beyond the individual. Sleep deprivation — even mild and chronic — has been linked to impaired cognitive performance, mood disturbances, weakened immune function, and increased risk of metabolic disorders such as obesity and type 2 diabetes. A landmark study published in 2017 estimated that the United States loses approximately 411 billion dollars annually in productivity due to insufficient sleep among its workforce. Similar economic analyses have been conducted in other industrialised nations, with comparable findings." },
        { label: "G", text: "Adolescents represent a particularly vulnerable population. Research indicates that during puberty, the circadian rhythm undergoes a biological shift, causing teenagers to feel sleepy later in the evening and wake later in the morning — a phenomenon known as sleep phase delay. When school schedules require early waking times that conflict with this shifted rhythm, adolescents accumulate what sleep researchers call 'sleep debt'. Accumulated sleep debt has been associated with decreased academic performance, elevated rates of depression, and riskier decision-making behaviour." }
      ]
    },

    // ── PASSAGE 2 ─────────────────────────────────────────────
    {
      id: "p2",
      title: "Urban Farming: Growing Food in the City",
      source: "Adapted from The Journal of Sustainable Agriculture, 2022",
      paragraphs: [
        { label: "A", text: "As the global population continues its relentless march toward ten billion, cities are being reimagined as active participants in food production. Urban farming — the practice of cultivating, processing, and distributing food within or around urban areas — has evolved from a niche hobby into a legitimate component of municipal food strategies across the world. Proponents argue that it offers a sustainable pathway to food security; critics question whether it can ever produce enough to matter." },
        { label: "B", text: "The roots of urban agriculture run deep. During both World War One and World War Two, the governments of several Allied nations launched 'victory garden' campaigns, encouraging civilians to grow vegetables on any available patch of land — from window boxes to public parks. In the United States alone, it is estimated that twenty million victory gardens were cultivated during the Second World War, producing roughly forty percent of the nation's vegetables at the peak of the campaign. The campaigns served not only a nutritional purpose but also a psychological one, fostering a sense of collective participation in the war effort." },
        { label: "C", text: "Contemporary urban farming takes many forms. Community gardens, in which plots of land are shared among neighbourhood residents, are among the most widespread. Rooftop farms, which transform unused building surfaces into productive growing areas, have gained particular traction in dense cities where ground-level space is scarce. Perhaps the most technologically ambitious form is vertical farming: the practice of growing crops in stacked layers within climate-controlled indoor facilities, often using hydroponic or aeroponic systems that deliver water and nutrients directly to plant roots without the use of soil." },
        { label: "D", text: "The environmental case for urban farming is frequently cited. Growing food closer to where it is consumed reduces the distance it must travel, lowering carbon emissions associated with transportation and refrigeration. Urban farms can also contribute to biodiversity, provide habitats for pollinators, and help manage stormwater runoff by absorbing rainfall that would otherwise overwhelm urban drainage systems. Green roofs and walls, which incorporate plant life into building design, can reduce the urban heat island effect by absorbing solar radiation and cooling surrounding air through evapotranspiration." },
        { label: "E", text: "However, the economic viability of urban farming remains contested. Land in cities is expensive, and the cost of constructing and operating sophisticated indoor vertical farms can be prohibitive. A 2021 analysis by researchers at the University of Wageningen found that while vertical farms are capable of achieving extraordinarily high yields per square metre — in some cases fifty times the output of conventional field farming — the energy costs associated with artificial lighting and climate control often undermine their financial sustainability. For most urban farming ventures, commercial viability depends on targeting premium markets willing to pay higher prices for locally grown, fresh produce." },
        { label: "F", text: "Social dimensions add another layer of complexity. Urban farms in lower-income neighbourhoods have been celebrated as tools for community empowerment and food justice, providing access to fresh produce in areas classified as 'food deserts' — localities where affordable, nutritious food is scarce. Yet critics warn of 'green gentrification': the phenomenon whereby improvements to the urban environment, including the introduction of green spaces and urban farms, raise property values and ultimately displace the low-income communities they were intended to benefit. Managing these tensions requires thoughtful urban planning and genuine community engagement." },
        { label: "G", text: "Looking ahead, the future of urban farming will likely be shaped by technological innovation. Advances in LED lighting, automation, and artificial intelligence are bringing down the costs of controlled-environment agriculture. Several start-up companies are experimenting with fully automated vertical farms in which robots handle sowing, harvesting, and packaging with minimal human intervention. Whether these developments will make urban farming a mainstream pillar of the global food system, or whether it will remain a supplementary and largely symbolic practice, is a question that urban planners, policymakers, and entrepreneurs are actively debating." }
      ]
    },

    // ── PASSAGE 3 ─────────────────────────────────────────────
    {
      id: "p3",
      title: "The Language of Colour",
      source: "Adapted from Cognitive Science: An Introduction to the Study of Mind, 4th ed.",
      paragraphs: [
        { label: "A", text: "The relationship between language and colour perception has fascinated philosophers, linguists, and cognitive scientists for centuries. At the heart of the debate lies a deceptively simple question: does the language we speak influence the way we perceive the world? The study of colour provides one of the most compelling and empirically tractable arenas in which to investigate this question, because colour is a continuous physical phenomenon — a spectrum of electromagnetic wavelengths — yet humans carve it into discrete, named categories." },
        { label: "B", text: "The number of basic colour terms varies considerably across languages. While English has eleven broadly recognised basic colour terms (black, white, red, green, yellow, blue, brown, orange, purple, pink, grey), some languages have far fewer. The Pirahã people of the Amazon Basin, for example, have been reported to use only terms equivalent to 'light' and 'dark'. At the other extreme, some languages make distinctions that English does not. Russian, for instance, obligatorily distinguishes between light blue (goluboy) and dark blue (siniy) with two separate basic terms, a distinction that English speakers can express only through modification." },
        { label: "C", text: "The question of whether such linguistic differences translate into perceptual differences was long dominated by a relativist position, most famously associated with the linguists Edward Sapir and Benjamin Lee Whorf. The Sapir-Whorf hypothesis, also known as linguistic relativity, proposes that the structure of a language affects its speakers' world view and cognitive processes. In its strong form — linguistic determinism — the hypothesis claims that language determines thought: that we can only perceive distinctions we have words for. This strong version has been largely discredited; the weak version, that language influences but does not determine thought, continues to attract research support." },
        { label: "D", text: "A landmark cross-cultural study conducted by Brent Berlin and Paul Kay in 1969 challenged the relativist position on colour. Analysing colour term data from over a hundred languages, they proposed that colour naming is not arbitrary but follows universal evolutionary patterns. Languages, they argued, acquire colour terms in a predictable sequence: all languages have terms for black and white; those with a third term always add red; those with a fourth add either yellow or green; and so on. This hierarchy suggested that perceptual salience, rather than cultural convention, drives colour categorisation." },
        { label: "E", text: "More recent research has complicated this universalist picture. A series of studies by Debi Roberson and colleagues, comparing the colour perception of English speakers with that of the Berinmo people of Papua New Guinea and the Himba of Namibia, found that the boundaries between colour categories varied systematically with the colour terms available in each language. Crucially, discrimination tasks — in which participants were asked to identify which of three colour chips was different from the other two — revealed that people were faster and more accurate when the target chip fell in a different linguistic category from the two others. This 'categorical perception' effect suggests that language does, in fact, shape the way colour is perceived." },
        { label: "F", text: "The debate has also been illuminated by neuroscience. Studies using event-related potentials (ERPs) — electrical signals recorded from the scalp that reflect brain activity with millisecond precision — have shown that colour categorical perception occurs in the left hemisphere of the brain, which is also dominant for language processing in most individuals. When colour chips crossing a linguistic category boundary are presented to the right visual field (processed by the left hemisphere), categorical perception effects are stronger than when they are presented to the left visual field. This hemispheric asymmetry provides neurological evidence that language systems are actively recruited during colour perception." },
        { label: "G", text: "The debate between universalism and relativism in colour perception has not been conclusively resolved, but the evidence has moved researchers toward a more nuanced middle ground. It appears that the basic architecture of the human visual system creates tendencies toward certain perceptual distinctions, but that language can sharpen, blur, or shift these distinctions in ways that have measurable cognitive consequences. Colour, it seems, is not simply seen — it is, at least in part, spoken." }
      ]
    }
  ],

  // ── ALL 40 QUESTIONS ──────────────────────────────────────────
  sections: [

    // ─── PASSAGE 1 QUESTIONS ──────────────────────────────────

    {
      passageId: "p1",
      type: "matching_headings",
      title: "Questions 1–5: Matching Headings",
      instruction: "The reading passage has seven paragraphs labelled A–G. Choose the correct heading for paragraphs B–F from the list of headings below. Write the correct letter i–x next to questions 1–5.",
      options: [
        "i.   The economic cost of insufficient sleep",
        "ii.  A biological time-keeping system",
        "iii. A turning point in sleep research",
        "iv.  Functions performed during a specific sleep stage",
        "v.   The architecture of a typical night's sleep",
        "vi.  Sleep and the teenage brain",
        "vii. Early theories about the purpose of rest",
        "viii.Sleep deprivation in the animal kingdom",
        "ix.  The impact of sleep loss on society",
        "x.   Memory formation during sleep"
      ],
      questions: [
        { id: 1, stem: "Paragraph B", answer: "iii" },
        { id: 2, stem: "Paragraph C", answer: "v" },
        { id: 3, stem: "Paragraph D", answer: "iv" },
        { id: 4, stem: "Paragraph E", answer: "ii" },
        { id: 5, stem: "Paragraph F", answer: "ix" }
      ]
    },

    {
      passageId: "p1",
      type: "true_false_ng",
      title: "Questions 6–9: True / False / Not Given",
      instruction: "Do the following statements agree with the information given in the reading passage? Write TRUE, FALSE, or NOT GIVEN.",
      questions: [
        { id: 6, stem: "Eugene Aserinsky and Nathaniel Kleitman were both affiliated with the same university when they discovered REM sleep.", answer: "TRUE" },
        { id: 7, stem: "The slow-wave sleep stage lasts longer than the REM sleep stage in a typical 90-minute cycle.", answer: "NOT GIVEN" },
        { id: 8, stem: "During REM sleep, the brain shows electrical activity that resembles the waking state.", answer: "TRUE" },
        { id: 9, stem: "The amygdala is the only brain region active during REM sleep.", answer: "FALSE" }
      ]
    },

    {
      passageId: "p1",
      type: "short_answer",
      title: "Questions 10–13: Short Answer",
      instruction: "Answer the questions below. Choose NO MORE THAN THREE WORDS from the passage for each answer.",
      questions: [
        { id: 10, stem: "What term describes the almost complete paralysis of the body that occurs during REM sleep?", answer: "muscle atonia" },
        { id: 11, stem: "How long does a typical sleep cycle last?", answer: "approximately 90 minutes" },
        { id: 12, stem: "What is the name of the brain region that houses the body's circadian clock?", answer: "suprachiasmatic nucleus" },
        { id: 13, stem: "What type of light is most effective at suppressing melatonin production?", answer: "blue-spectrum light" }
      ]
    },

    // ─── PASSAGE 2 QUESTIONS ──────────────────────────────────

    {
      passageId: "p2",
      type: "matching_information",
      title: "Questions 14–18: Matching Information",
      instruction: "The reading passage has seven paragraphs labelled A–G. Which paragraph contains the following information? You may use any letter more than once.",
      questions: [
        { id: 14, stem: "A reference to a programme that had both practical and psychological benefits during a period of conflict", answer: "B" },
        { id: 15, stem: "A description of a farming method that does not use soil", answer: "C" },
        { id: 16, stem: "An explanation of how urban farming can improve air temperature in cities", answer: "D" },
        { id: 17, stem: "A warning about the negative social consequences of urban environmental improvements", answer: "F" },
        { id: 18, stem: "A mention of farms operated without significant human labour", answer: "G" }
      ]
    },

    {
      passageId: "p2",
      type: "multiple_choice",
      title: "Questions 19–21: Multiple Choice",
      instruction: "Choose the correct letter, A, B, C, or D.",
      questions: [
        {
          id: 19,
          stem: "According to paragraph B, what was the result of victory garden campaigns in the United States during World War Two?",
          options: [
            { letter: "A", text: "Twenty million people were employed in food production." },
            { letter: "B", text: "The government was able to reduce military spending on food." },
            { letter: "C", text: "Around forty per cent of the country's vegetables were produced by civilians." },
            { letter: "D", text: "The campaigns led to a permanent change in American eating habits." }
          ],
          answer: "C"
        },
        {
          id: 20,
          stem: "What does the 2021 Wageningen University analysis suggest about vertical farming?",
          options: [
            { letter: "A", text: "It is consistently profitable in most urban markets." },
            { letter: "B", text: "Its energy costs can make it financially unsustainable despite high yields." },
            { letter: "C", text: "It produces lower yields per square metre than conventional farming." },
            { letter: "D", text: "Its costs are falling rapidly and it will soon be widely adopted." }
          ],
          answer: "B"
        },
        {
          id: 21,
          stem: "What is described as 'green gentrification' in the passage?",
          options: [
            { letter: "A", text: "The use of green technology to reduce a building's energy consumption" },
            { letter: "B", text: "The conversion of industrial land into community gardens" },
            { letter: "C", text: "A process where environmental upgrades displace low-income residents" },
            { letter: "D", text: "A government policy to increase green space in wealthy areas" }
          ],
          answer: "C"
        }
      ]
    },

    {
      passageId: "p2",
      type: "sentence_completion",
      title: "Questions 22–26: Sentence Completion",
      instruction: "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
      questions: [
        { id: 22, stem: "The practice of growing food within or around cities is broadly referred to as ___________.", answer: "urban farming" },
        { id: 23, stem: "Rooftop farms have become popular in cities where ___________ space is limited.", answer: "ground-level" },
        { id: 24, stem: "Green roofs can reduce the urban heat island effect through a process called ___________.", answer: "evapotranspiration" },
        { id: 25, stem: "Areas where affordable, nutritious food is difficult to obtain are known as food ___________.", answer: "deserts" },
        { id: 26, stem: "In fully automated vertical farms, ___________ carry out tasks such as sowing and harvesting.", answer: "robots" }
      ]
    },

    // ─── PASSAGE 3 QUESTIONS ──────────────────────────────────

    {
      passageId: "p3",
      type: "matching_features",
      title: "Questions 27–30: Matching Features",
      instruction: "Match each finding or idea (Questions 27–30) with the researcher or group it is associated with (A–E). You may use any letter more than once.",
      options: [
        "A  Edward Sapir and Benjamin Lee Whorf",
        "B  Brent Berlin and Paul Kay",
        "C  Debi Roberson and colleagues",
        "D  The Pirahã people",
        "E  Russian speakers"
      ],
      questions: [
        { id: 27, stem: "Languages acquire colour terms in a predictable, universal order.", answer: "B" },
        { id: 28, stem: "A language that uses only two colour-like terms relating to lightness and darkness.", answer: "D" },
        { id: 29, stem: "Colour category boundaries differ based on the colour terms a person's language contains.", answer: "C" },
        { id: 30, stem: "The structure of language shapes speakers' perceptions and cognitive processes.", answer: "A" }
      ]
    },

    {
      passageId: "p3",
      type: "true_false_ng",
      title: "Questions 31–34: Yes / No / Not Given",
      instruction: "Do the following statements agree with the claims of the writer? Write YES, NO, or NOT GIVEN.",
      variant: "yes_no_ng",
      questions: [
        { id: 31, stem: "The strong version of the Sapir-Whorf hypothesis is no longer considered credible by most researchers.", answer: "YES" },
        { id: 32, stem: "Berlin and Kay's 1969 study was the first ever to examine colour terms across languages.", answer: "NOT GIVEN" },
        { id: 33, stem: "The Himba people of Namibia have more basic colour terms than English speakers.", answer: "NOT GIVEN" },
        { id: 34, stem: "The categorical perception effect was stronger in the left hemisphere than in the right hemisphere.", answer: "YES" }
      ]
    },

    {
      passageId: "p3",
      type: "summary_completion",
      title: "Questions 35–38: Summary Completion",
      instruction: "Complete the summary below using words from the box. Write the correct word in blanks 35–38.",
      wordBank: ["perceptual", "linguistic", "electromagnetic", "cultural", "universal", "arbitrary", "neurological", "evolutionary"],
      summaryTemplate: "Berlin and Kay's research suggested that colour naming is not [35] but instead follows [36] patterns. However, later studies showed that colour category boundaries vary according to the [37] categories available in a given language. Neuroscientific research has provided [38] evidence that the brain's language systems are involved in colour perception.",
      questions: [
        { id: 35, blankIndex: 0, answer: "arbitrary" },
        { id: 36, blankIndex: 1, answer: "universal" },
        { id: 37, blankIndex: 2, answer: "linguistic" },
        { id: 38, blankIndex: 3, answer: "neurological" }
      ]
    },

    {
      passageId: "p3",
      type: "diagram_completion",
      title: "Questions 39–40: Diagram Label Completion",
      instruction: "Label the diagram below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
      diagramImage: null,
      diagramPlaceholder: true,
      diagramNote: "PLACEHOLDER: Replace this with an actual diagram image (e.g., a diagram of a sleep cycle or a brain region map). Place the image file in the /images/ folder and update the 'diagramImage' field in this test's JSON data to the filename (e.g., 'images/passage3-diagram.png').",
      diagramDescription: "Diagram showing the two hemispheres of the brain and the visual fields, illustrating the categorical perception asymmetry described in Paragraph F.",
      questions: [
        { id: 39, stem: "Label A — The hemisphere where categorical colour perception effects are stronger:", answer: "left hemisphere" },
        { id: 40, stem: "Label B — The type of signals used in the neurological study described in Paragraph F:", answer: "event-related potentials" }
      ]
    }
  ]
};
