(function () {
  "use strict";

  const games = [
    { id: "tap-sprint", type: "tap", category: "tap", icon: "⚡", goal: 18, time: 12, name: { ar: "عدّاء النقر", en: "Tap Sprint" }, description: { ar: "كم نقرة سريعة تستطيع تسجيلها قبل انتهاء الوقت؟", en: "How many quick taps can you land before time runs out?" } },
    { id: "bubble-burst", type: "tap", category: "arcade", icon: "🫧", goal: 24, time: 15, name: { ar: "فقاعات طائرة", en: "Bubble Burst" }, description: { ar: "افقع الفقاعات قبل أن تختفي — السرعة تصنع الفرق.", en: "Pop the bubbles before they drift away. Speed is everything." } },
    { id: "pixel-punch", type: "tap", category: "arcade", icon: "👾", goal: 40, time: 25, name: { ar: "لكمة البكسل", en: "Pixel Punch" }, description: { ar: "اختبر تحمّلك في ماراثون نقر ممتع.", en: "Test your stamina in a playful tapping marathon." } },
    { id: "star-clicker", type: "tap", category: "tap", icon: "🌟", goal: 55, time: 30, name: { ar: "صائد النجوم", en: "Star Clicker" }, description: { ar: "اجمع كوكبة من النجوم بنقرات متتالية.", en: "Build a constellation with one tap at a time." } },

    { id: "traffic-reaction", type: "reaction", category: "focus", icon: "🚦", goal: 3, name: { ar: "إشارة الانطلاق", en: "Traffic Reaction" }, description: { ar: "راقب الإشارة واضغط فور تحوّلها إلى الأخضر.", en: "Watch the signal and tap the moment it turns green." } },
    { id: "lightning-reflex", type: "reaction", category: "speed", icon: "⚡", goal: 4, name: { ar: "ردّة البرق", en: "Lightning Reflex" }, description: { ar: "أربع إشارات خاطفة تختبر سرعة استجابتك.", en: "Four lightning signals put your reflexes to the test." } },
    { id: "neon-signal", type: "reaction", category: "arcade", icon: "💡", goal: 5, name: { ar: "إشارة نيون", en: "Neon Signal" }, description: { ar: "اتبع الوميض واجمع خمس استجابات صحيحة.", en: "Follow the flash and land five clean reactions." } },
    { id: "quick-draw", type: "reaction", category: "skill", icon: "🎯", goal: 5, name: { ar: "السحب السريع", en: "Quick Draw" }, description: { ar: "لا تتحرك حتى تظهر الإشارة — ثم كن الأسرع.", en: "Hold steady until the cue, then be the fastest." } },

    { id: "echo-sequence", type: "sequence", category: "memory", icon: "🎨", length: 3, name: { ar: "صدى الألوان", en: "Echo Sequence" }, description: { ar: "شاهد الألوان المضيئة ثم كرر التسلسل.", en: "Watch the lit colors, then repeat the sequence." } },
    { id: "simon-says", type: "sequence", category: "memory", icon: "🔔", length: 4, name: { ar: "سيمون يقول", en: "Simon Says" }, description: { ar: "هل تستطيع حفظ نمط يزداد طولاً؟", en: "Can you remember a pattern that grows longer?" } },
    { id: "memory-melody", type: "sequence", category: "memory", icon: "🎵", length: 6, name: { ar: "لحن الذاكرة", en: "Memory Melody" }, description: { ar: "احفظ ست نغمات لونية وأعد عزفها.", en: "Memorize six colorful notes and play them back." } },
    { id: "brain-beacon", type: "sequence", category: "logic", icon: "🧠", length: 7, name: { ar: "منارة الذاكرة", en: "Brain Beacon" }, description: { ar: "تحدٍّ متقدم لتقوية الذاكرة قصيرة المدى.", en: "An advanced challenge for your short-term memory." } },

    { id: "quick-add", type: "math", category: "numbers", icon: "➕", operation: "+", range: 12, rounds: 5, name: { ar: "جمع خاطف", en: "Quick Add" }, description: { ar: "اجمع الأرقام قبل أن يسبقك الوقت.", en: "Add the numbers before the clock beats you." } },
    { id: "number-ninja", type: "math", category: "numbers", icon: "🥷", operation: "−", range: 30, rounds: 6, name: { ar: "نينجا الأرقام", en: "Number Ninja" }, description: { ar: "اطرح بسرعة ودقة لتكسب الجولة.", en: "Subtract fast and accurately to win the round." } },
    { id: "times-table", type: "math", category: "logic", icon: "✖️", operation: "×", range: 12, rounds: 6, name: { ar: "جدول الضرب", en: "Times Table" }, description: { ar: "اختبر سرعة استدعاء جداول الضرب.", en: "Put your times-table recall to the test." } },
    { id: "mixed-operator", type: "math", category: "numbers", icon: "🧮", operation: "mixed", range: 20, rounds: 7, name: { ar: "العملية المختلطة", en: "Mixed Operator" }, description: { ar: "عمليات متغيرة في سلسلة حسابية قصيرة.", en: "A quick arithmetic streak with changing operations." } },
    { id: "square-rush", type: "math", category: "speed", icon: "🔢", operation: "square", range: 15, rounds: 5, name: { ar: "مربع السرعة", en: "Square Rush" }, description: { ar: "احسب مربعات الأعداد الصغيرة على السريع.", en: "Square small numbers against the clock." } },

    { id: "ascending-rush", type: "order", category: "numbers", icon: "🔀", count: 6, name: { ar: "ترتيب تصاعدي", en: "Ascending Rush" }, description: { ar: "رتّب الأرقام المبعثرة من الأصغر إلى الأكبر.", en: "Put the shuffled numbers in ascending order." } },
    { id: "countdown-order", type: "order", category: "speed", icon: "⏱️", count: 10, name: { ar: "ترتيب مع العدّ", en: "Countdown Order" }, description: { ar: "اختر عشرة أرقام متتالية بأقل وقت.", en: "Select ten numbers in order as quickly as you can." } },
    { id: "prime-path", type: "order", category: "numbers", icon: "💠", count: 12, name: { ar: "مسار الأعداد", en: "Number Path" }, description: { ar: "اتبع السلسلة الرقمية من البداية للنهاية.", en: "Follow the number trail from start to finish." } },
    { id: "grand-sequence", type: "order", category: "skill", icon: "🏁", count: 16, name: { ar: "السلسلة الكبرى", en: "Grand Sequence" }, description: { ar: "ستة عشر رقماً مبعثراً وتحدٍّ واحد للتركيز.", en: "Sixteen shuffled numbers. One test of focus." } },

    { id: "odd-one-out", type: "odd", category: "focus", icon: "🔍", count: 9, odd: "◆", common: "●", name: { ar: "أين المختلف؟", en: "Odd One Out" }, description: { ar: "اعثر على الشكل الوحيد المختلف بين الرموز.", en: "Spot the one shape that differs from the rest." } },
    { id: "shape-spotter", type: "odd", category: "logic", icon: "🔺", count: 12, odd: "▲", common: "△", name: { ar: "صيّاد الأشكال", en: "Shape Spotter" }, description: { ar: "ميّز الرمز الممتلئ وسط الأشكال المجوفة.", en: "Find the filled symbol among the outlines." } },
    { id: "tiny-difference", type: "odd", category: "focus", icon: "🕵️", count: 20, odd: "♣", common: "♠", name: { ar: "الفرق الصغير", en: "Tiny Difference" }, description: { ar: "فرق بسيط بين الرموز، فهل تلاحظه؟", en: "A subtle symbol difference. Can you spot it?" } },
    { id: "pattern-breaker", type: "odd", category: "skill", icon: "🌀", count: 24, odd: "⬟", common: "⬢", name: { ar: "كاسر النمط", en: "Pattern Breaker" }, description: { ar: "أكبر شبكة حتى الآن — اعثر على العنصر الشاذ.", en: "The biggest grid yet. Find the element that breaks the pattern." } },

    { id: "pixel-typing", type: "typing", category: "speed", icon: "⌨️", word: "PIXEL", name: { ar: "طباعة البكسل", en: "Pixel Typing" }, description: { ar: "اكتب الكلمة الظاهرة بسرعة ودون أخطاء.", en: "Type the displayed word quickly and accurately." } },
    { id: "space-code", type: "typing", category: "skill", icon: "🚀", word: "ORBIT", name: { ar: "شفرة الفضاء", en: "Space Code" }, description: { ar: "أدخل الشفرة قبل أن تنطلق المركبة.", en: "Enter the code before the spacecraft launches." } },
    { id: "keyboard-quest", type: "typing", category: "focus", icon: "🗝️", word: "QUEST", name: { ar: "مهمة لوحة المفاتيح", en: "Keyboard Quest" }, description: { ar: "افتح البوابة بكتابة كلمة المهمة.", en: "Open the gate by typing the quest word." } },
    { id: "turbo-typing", type: "typing", category: "speed", icon: "💨", word: "TURBO", name: { ar: "طباعة توربو", en: "Turbo Typing" }, description: { ar: "تحدٍّ قصير لأصابع سريعة ودقيقة.", en: "A short challenge for fast, accurate fingers." } },
    { id: "secret-signal", type: "typing", category: "logic", icon: "📡", word: "NOVA7", name: { ar: "الإشارة السرية", en: "Secret Signal" }, description: { ar: "أرسل الإشارة الصحيحة لاستكمال الاتصال.", en: "Send the right signal to complete the connection." } },

    { id: "target-practice", type: "aim", category: "arcade", icon: "🎯", goal: 5, name: { ar: "تدريب التصويب", en: "Target Practice" }, description: { ar: "أصب أهدافاً صغيرة تتحرك إلى أماكن جديدة.", en: "Hit small targets as they jump to new spots." } },
    { id: "neon-hunter", type: "aim", category: "focus", icon: "🟣", goal: 7, name: { ar: "صيّاد النيون", en: "Neon Hunter" }, description: { ar: "التقط سبعة أهداف مضيئة بدقة.", en: "Tag seven glowing targets with precision." } },
    { id: "meteor-pop", type: "aim", category: "arcade", icon: "☄️", goal: 8, name: { ar: "تفجير الشهب", en: "Meteor Pop" }, description: { ar: "أوقف الشهب قبل أن تعبر ساحة اللعب.", en: "Stop the meteors before they cross the playfield." } },
    { id: "bullseye-blitz", type: "aim", category: "skill", icon: "🥏", goal: 10, name: { ar: "وابل الأهداف", en: "Bullseye Blitz" }, description: { ar: "عشرة أهداف متلاحقة لاختبار دقة يدك.", en: "Ten consecutive targets to test your aim." } },
    { id: "comet-chaser", type: "aim", category: "speed", icon: "🌠", goal: 12, name: { ar: "مطارد المذنبات", en: "Comet Chaser" }, description: { ar: "طارد المذنبات السريعة وأكمل السلسلة.", en: "Chase down the comets and complete the streak." } },

    { id: "stop-the-clock", type: "precision", category: "precision", icon: "⏱️", target: 3.5, name: { ar: "أوقف الساعة", en: "Stop the Clock" }, description: { ar: "أوقف المؤقت عند ثلاث ثوانٍ ونصف.", en: "Stop the timer as close to three and a half seconds as you can." } },
    { id: "golden-second", type: "precision", category: "precision", icon: "🥇", target: 5, name: { ar: "الثانية الذهبية", en: "Golden Second" }, description: { ar: "اعتمد على إحساسك بالوقت وأوقفه عند خمس ثوانٍ.", en: "Trust your sense of time and stop at five seconds." } },
    { id: "needle-center", type: "precision", category: "skill", icon: "🧭", target: 7, name: { ar: "منتصف المؤشر", en: "Needle Center" }, description: { ar: "وازن المؤقت على سبع ثوانٍ كاملة.", en: "Balance the timer on exactly seven seconds." } },
    { id: "steady-hand", type: "precision", category: "focus", icon: "🫳", target: 4, name: { ar: "اليد الثابتة", en: "Steady Hand" }, description: { ar: "تحتاج إلى تركيز وهدوء لتصيب أربع ثوانٍ.", en: "Stay calm and focused to hit four seconds." } },
    { id: "time-capsule", type: "precision", category: "precision", icon: "⌛", target: 9, name: { ar: "كبسولة الزمن", en: "Time Capsule" }, description: { ar: "تحدٍّ طويل للإحساس بالثواني من دون ساعة.", en: "A longer test of your internal clock — no stopwatch." } },

    { id: "treasure-dash", type: "dodge", category: "arcade", icon: "🗺️", goal: 4, hazards: 1, name: { ar: "اندفاعة الكنز", en: "Treasure Dash" }, description: { ar: "تنقّل على الشبكة واجمع الكنوز قبل الخطر.", en: "Navigate the grid and collect treasures before danger catches up." } },
    { id: "comet-dodge", type: "dodge", category: "survival", icon: "☄️", goal: 5, hazards: 2, name: { ar: "تفادي المذنبات", en: "Comet Dodge" }, description: { ar: "اجمع الطاقة وابتعد عن المذنبات المتحركة.", en: "Collect energy and avoid the moving comets." } },
    { id: "grid-escape", type: "dodge", category: "logic", icon: "🧱", goal: 5, hazards: 1, name: { ar: "الهروب الشبكي", en: "Grid Escape" }, description: { ar: "خطط لتحركاتك حتى تصل إلى المخرج.", en: "Plan your moves carefully to reach the exit." } },
    { id: "star-survivor", type: "dodge", category: "survival", icon: "🌟", goal: 7, hazards: 2, name: { ar: "ناجي النجوم", en: "Star Survivor" }, description: { ar: "اجمع سبع نجوم وتفادَ الأخطار المتحركة.", en: "Collect seven stars while dodging moving hazards." } },
    { id: "maze-runner", type: "dodge", category: "skill", icon: "🏃", goal: 8, hazards: 2, name: { ar: "عدّاء المتاهة", en: "Maze Runner" }, description: { ar: "تحدٍّ كبير في شبكة مليئة بالمفاجآت.", en: "A bigger grid challenge full of surprises." } },

    { id: "memory-pairs", type: "pairs", category: "memory", icon: "🃏", pairs: 3, name: { ar: "أزواج الذاكرة", en: "Memory Pairs" }, description: { ar: "اكشف البطاقات واعثر على ثلاثة أزواج.", en: "Flip the cards and find three matching pairs." } },
    { id: "emoji-match", type: "pairs", category: "memory", icon: "🍒", pairs: 4, name: { ar: "مطابقة الرموز", en: "Emoji Match" }, description: { ar: "ذاكر مواضع الرموز واكشف الأزواج المتشابهة.", en: "Remember the symbols and uncover matching pairs." } },
    { id: "treasure-match", type: "pairs", category: "logic", icon: "💎", pairs: 5, name: { ar: "مطابقة الكنوز", en: "Treasure Match" }, description: { ar: "اكشف عشرة صناديق للعثور على الكنوز المتطابقة.", en: "Open ten chests to uncover matching treasures." } },
    { id: "constellation-cards", type: "pairs", category: "focus", icon: "🌌", pairs: 6, name: { ar: "بطاقات الكوكبة", en: "Constellation Cards" }, description: { ar: "اربط النجوم المتشابهة في لوحة أكبر.", en: "Pair the matching stars across a larger board." } },
    { id: "grand-memory", type: "pairs", category: "skill", icon: "🧠", pairs: 8, name: { ar: "الذاكرة الكبرى", en: "Grand Memory" }, description: { ar: "ستة عشر بطاقة — هل تستطيع تذكّر أماكنها؟", en: "Sixteen cards. Can you remember where they are?" } }
  ];

  window.GameCatalog = games;
})();
