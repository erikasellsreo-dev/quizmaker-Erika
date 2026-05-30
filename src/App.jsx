import { useState, useEffect, useRef } from "react";
import { Camera, Leaf, Sparkles, ChevronRight, ChevronLeft, Bookmark, BookmarkPlus, CheckCircle2, XCircle, AlertCircle, ArrowLeft, Edit3 } from "lucide-react";

const TOPICS = [
  { key: "photography", label: "Photography", emoji: "📷", color: "#1a1a2e", accent: "#e94560", description: "Camera, composition, editing & more", subtopics: ["Camera Basics", "Light & Composition", "Post Processing", "Creative Photography", "Custom"] },
  { key: "plants", label: "Plants", emoji: "🌿", color: "#0f2017", accent: "#4caf50", description: "Tropical, care, propagation & more", subtopics: ["Soil & Mixtures", "Feeding & Fertilizing", "Repotting & Roots", "Tropical Plant Care", "Orchid Care", "Bonsai Basics", "Propagation", "Balcony & Pot Growing", "Diagnose & Fix", "Plant Hacks & Tips", "Custom"] },
  { key: "aromatherapy", label: "Aromatherapy", emoji: "🌸", color: "#1e1428", accent: "#c084fc", description: "Essential oils, blending, wellness & more", subtopics: ["Essential Oil Basics", "Blending & Recipes", "Carrier Oils", "Safety & Dilution", "DIY Inhalers", "DIY Moisturizers & Skincare", "Home & Diffuser Blends", "Scent Retention & Storage", "Health & Wellness", "Essential Oil Tips & Hacks", "Custom"] },
];

const SEEDS = {
  photography: [
    { question: "What does aperture control?", options: ["Battery life", "Depth of field", "Memory speed", "White balance"], answer: "Depth of field", explanation: "Aperture controls how much of the scene appears sharp." },
    { question: "What does high ISO add?", options: ["Noise", "Battery life", "Zoom", "Sharpness"], answer: "Noise", explanation: "High ISO amplifies the sensor signal, adding grain." },
    { question: "What is the rule of thirds?", options: ["Dividing frame into 9 parts", "Using 3 light sources", "Shooting at f/3", "3 second exposure"], answer: "Dividing frame into 9 parts", explanation: "Placing subjects along gridlines creates balanced compositions." },
    { question: "What does RAW format preserve?", options: ["All sensor data", "Compressed pixels", "JPEG preview only", "Color profile only"], answer: "All sensor data", explanation: "RAW retains maximum data for editing." },
    { question: "What is bokeh?", options: ["Aesthetic blur in background", "Camera shake", "Overexposure", "Lens flare"], answer: "Aesthetic blur in background", explanation: "Bokeh is the pleasing out-of-focus quality in photos." },
  ],
  plants: [
    { question: "What causes root rot?", options: ["Too much sun", "Overwatering", "Cold air", "Clay pot"], answer: "Overwatering", explanation: "Roots need oxygen and rot in constantly wet soil." },
    { question: "What does NPK stand for?", options: ["Nitrogen, Phosphorus, Potassium", "Natural Plant Kinetics", "Nitrate, Protein, Kelp", "None of these"], answer: "Nitrogen, Phosphorus, Potassium", explanation: "The three main macronutrients plants need." },
    { question: "Why use drainage holes?", options: ["Decoration", "Release excess water", "Grow roots outside", "Hold fertilizer"], answer: "Release excess water", explanation: "Drainage holes prevent waterlogged soil." },
    { question: "What does perlite add to soil?", options: ["Drainage and aeration", "Nutrients", "Water retention", "Color"], answer: "Drainage and aeration", explanation: "Perlite improves drainage and prevents compaction." },
    { question: "What do yellow leaves usually indicate?", options: ["Overwatering or nutrient deficiency", "Too much light", "Repotting needed", "Normal aging only"], answer: "Overwatering or nutrient deficiency", explanation: "Yellow leaves are a stress signal — check soil moisture first." },
  ],
  aromatherapy: [
    { question: "Which oil is most known for promoting sleep?", options: ["Lavender", "Peppermint", "Lemon", "Eucalyptus"], answer: "Lavender", explanation: "Lavender is widely studied for its calming properties." },
    { question: "What are top notes in a blend?", options: ["First scents you smell, fade quickly", "Base of the blend", "Strongest oils", "Oils used for skin"], answer: "First scents you smell, fade quickly", explanation: "Top notes give first impression but evaporate fast." },
    { question: "What is the safe dilution for adults?", options: ["1-3% in carrier oil", "50% essential oil", "Undiluted is fine", "10% minimum"], answer: "1-3% in carrier oil", explanation: "Most essential oils should be diluted to 1-3% for safe topical use." },
    { question: "What do carrier oils do?", options: ["Dilute essential oils for skin", "Add fragrance", "Replace essential oils", "Preserve blends"], answer: "Dilute essential oils for skin", explanation: "Carrier oils make essential oils safe for topical application." },
    { question: "Which oil should be avoided in pregnancy?", options: ["Clary sage", "Lavender", "Frankincense", "Chamomile"], answer: "Clary sage", explanation: "Clary sage can stimulate contractions." },
  ],
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

async function fetchAIQuestions(topic, subtopic, difficulty, seen, count) {
  const seenNote = seen.length ? `Do NOT repeat these questions: ${seen.slice(-20).join(" | ")}` : "";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        temperature: 1,
        messages: [{
          role: "user",
          content: `Generate ${count} multiple choice quiz questions about "${subtopic}" in the context of ${topic} at ${difficulty} difficulty (Easy = basic concepts, Medium = requires some experience, Hard = advanced level).
${seenNote}
Rules: Mix question styles, cover different angles, make questions practical and useful.
Return ONLY a valid JSON array. Each object must have: "question" (string), "options" (array of 4 strings), "answer" (string matching one option), "explanation" (string).
No markdown, no preamble, just the JSON array.`,
        }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    const jsonStr = start !== -1 && end !== -1 ? clean.slice(start, end + 1) : clean;
    const parsed = JSON.parse(jsonStr);
    return parsed.map((q) => ({ ...q, aiGenerated: true }));
  } catch {
    const pool = SEEDS[topic] ?? [];
    return shuffle(Array.from({ length: count }, (_, i) => ({ ...pool[i % pool.length], aiGenerated: false })));
  }
}

export default function QuizApp() {
  const [screen, setScreen] = useState("home");
  const [topic, setTopic] = useState(null);
  const [subtopic, setSubtopic] = useState(null);
  const [customText, setCustomText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [reviewList, setReviewList] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewAnswers, setReviewAnswers] = useState({});
  const [difficulty, setDifficulty] = useState("Easy");
  const [levelUpMsg, setLevelUpMsg] = useState("");
  const seenQ = useRef([]);
  const fetchingMore = useRef(false);

  const topicData = TOPICS.find((t) => t.key === topic);

  async function startQuiz(t, s) {
    setTopic(t);
    setSubtopic(s);
    setQuestions([]);
    setAnswers({});
    setFlagged(new Set());
    setIndex(0);
    setDifficulty("Easy");
    setLevelUpMsg("");
    seenQ.current = [];
    setScreen("quiz");
    setLoading(true);
    const qs = await fetchAIQuestions(t, s, "Easy", [], 5);
    seenQ.current = qs.map((q) => q.question);
    setQuestions(qs);
    setLoading(false);
  }

  useEffect(() => {
    if (screen !== "quiz" || fetchingMore.current || loading) return;
    if (questions.length > 0 && questions.length - index <= 3) {
      fetchingMore.current = true;
      fetchAIQuestions(topic, subtopic, difficulty, seenQ.current, 5).then((more) => {
        const existing = new Set(seenQ.current.map((q) => q.toLowerCase()));
        const filtered = more.filter((q) => !existing.has(q.question.toLowerCase()));
        const toAdd = filtered.length > 0 ? filtered : more;
        seenQ.current = [...seenQ.current, ...toAdd.map((q) => q.question)];
        setQuestions((prev) => [...prev, ...toAdd]);
        fetchingMore.current = false;
      });
    }
  }, [index, questions.length, screen, topic, subtopic, difficulty, loading]);

  function answerQuestion(option) {
    if (answers[index] !== undefined) return;
    const newAnswers = { ...answers, [index]: option };
    setAnswers(newAnswers);
    const total = Object.keys(newAnswers).length;
    if (total >= 5) {
      const correct = Object.entries(newAnswers).filter(([i, a]) => a === questions[Number(i)]?.answer).length;
      const acc = Math.round((correct / total) * 100);
      if (acc >= 80) {
        if (difficulty === "Easy") {
          setDifficulty("Medium");
          setLevelUpMsg("🎉 Level Up! Moving to Medium");
          setTimeout(() => setLevelUpMsg(""), 3000);
        } else if (difficulty === "Medium") {
          setDifficulty("Hard");
          setLevelUpMsg("🔥 Level Up! Moving to Hard");
          setTimeout(() => setLevelUpMsg(""), 3000);
        }
      }
    }
  }

  function toggleFlag() {
    setFlagged((prev) => { const next = new Set(prev); next.has(index) ? next.delete(index) : next.add(index); return next; });
  }

  function openReview() {
    setReviewList([...flagged].map((i) => questions[i]));
    setReviewIndex(0);
    setReviewAnswers({});
    setScreen("review");
  }

  const current = questions[index];
  const reviewCurrent = reviewList[reviewIndex];
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(([i, a]) => a === questions[Number(i)]?.answer).length;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // HOME
  if (screen === "home") {
    return (
      <div style={s.page}>
        <div style={s.homeWrap}>
          <div style={s.badge}><Sparkles size={13} /> AI-Powered · Infinite Questions</div>
          <h1 style={s.title}>What would you<br />like to learn?</h1>
          <div style={{ marginBottom: 32 }} />
          {TOPICS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} style={{ ...s.topicCard, background: t.color, borderColor: "#ffffff18" }} onClick={() => { setTopic(t.key); setScreen("subtopics"); }}>
                <span style={s.topicEmoji}>{t.emoji}</span>
                <div style={s.topicInfo}><div style={s.topicLabel}>{t.label}</div><div style={s.topicDesc}>{t.description}</div></div>
                <ChevronRight size={18} color="#555" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // SUBTOPICS
  if (screen === "subtopics" && topicData) {
    return (
      <div style={s.page}>
        <div style={s.wrap}>
          <button style={s.back} onClick={() => setScreen("home")}><ArrowLeft size={16} /> Back</button>
          <div style={{ marginBottom: 24 }}>
            <div style={s.topicBig}>{topicData.emoji} {topicData.label}</div>
            <div style={s.subLabel}>Choose a topic to quiz yourself on</div>
          </div>
          {topicData.subtopics.map((st) =>
            st === "Custom" ? (
              <button key="custom" style={{ ...s.subtopicCard, borderColor: topicData.accent + "55", color: topicData.accent }} onClick={() => setScreen("custom")}>
                <Edit3 size={15} /><span>Custom — type your own topic</span><ChevronRight size={15} style={{ marginLeft: "auto" }} />
              </button>
            ) : (
              <button key={st} style={{ ...s.subtopicCard, borderColor: "#ffffff18" }} onClick={() => startQuiz(topicData.key, st)}>
                <span>{st}</span><ChevronRight size={15} style={{ marginLeft: "auto", color: "#555" }} />
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  // CUSTOM
  if (screen === "custom" && topicData) {
    return (
      <div style={s.page}>
        <div style={s.wrap}>
          <button style={s.back} onClick={() => setScreen("subtopics")}><ArrowLeft size={16} /> Back</button>
          <div style={{ marginBottom: 24 }}>
            <div style={s.topicBig}>{topicData.emoji} Custom Topic</div>
            <div style={s.subLabel}>Type anything you want to be quizzed on</div>
          </div>
          <input style={s.input} placeholder={`e.g. "Bougainvillea pruning" or "Golden hour photography"`} value={customText} onChange={(e) => setCustomText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && customText.trim()) startQuiz(topicData.key, customText.trim()); }} autoFocus />
          <button style={{ ...s.startBtn, background: topicData.accent, opacity: customText.trim() ? 1 : 0.4 }} onClick={() => { if (customText.trim()) startQuiz(topicData.key, customText.trim()); }} disabled={!customText.trim()}>
            Start Quiz <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // QUIZ
  if (screen === "quiz") {
    const accent = topicData?.accent ?? "#e94560";
    const isFlagged = flagged.has(index);
    const selected = answers[index];
    const diffColor = difficulty === "Easy" ? "#4caf50" : difficulty === "Medium" ? "#f5a623" : "#e94560";

    return (
      <div style={s.page}>
        <div style={s.quizWrap}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={s.spinner} />
              <p style={{ color: "#666", fontSize: 14, marginTop: 16 }}>Generating questions on<br /><strong style={{ color: "#fff" }}>{subtopic}</strong></p>
            </div>
          ) : current ? (
            <>
              <div style={s.quizHeader}>
                <button style={s.back} onClick={() => setScreen("subtopics")}><ArrowLeft size={16} /> Topics</button>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#555" }}>{topicData?.emoji} {subtopic}</div>
                  <div style={{ fontSize: 12, color: accent }}>{accuracy}% correct · {answeredCount} answered</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: diffColor }}>{difficulty}</div>
                </div>
                <button style={{ ...s.back, color: isFlagged ? accent : "#444", flexDirection: "column", gap: 2, alignItems: "center" }} onClick={toggleFlag}>
                  {isFlagged ? <Bookmark size={18} fill="currentColor" /> : <BookmarkPlus size={18} />}
                  <span style={{ fontSize: 10 }}>{isFlagged ? "Flagged" : "Flag"}</span>
                </button>
              </div>

              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, background: accent, width: `${Math.min(((index + 1) / questions.length) * 100, 100)}%` }} />
              </div>

              <div style={{ fontSize: 12, color: "#444", marginBottom: 12 }}>Question {index + 1}</div>

              {levelUpMsg && (
                <div style={{ background: "#22c55e22", border: "1px solid #22c55e", borderRadius: 12, padding: "12px 16px", textAlign: "center", fontSize: 15, fontWeight: 700, color: "#22c55e", marginBottom: 12 }}>
                  {levelUpMsg}
                </div>
              )}

              <div style={s.questionBox}>
                <h2 style={s.questionText}>{current.question}</h2>
              </div>

              <div style={s.optionsList}>
                {current.options.map((opt) => {
                  const isCorrect = opt === current.answer;
                  const isSelected = opt === selected;
                  let bg = "#ffffff06", border = "#ffffff14", color = "#ccc";
                  if (selected) {
                    if (isCorrect) { bg = "#22c55e22"; border = "#22c55e"; color = "#fff"; }
                    else if (isSelected) { bg = "#6b728033"; border = "#6b7280"; color = "#aaa"; }
                  }
                  return (
                    <button key={opt} style={{ ...s.optionBtn, background: bg, borderColor: border, color }} onClick={() => answerQuestion(opt)}>
                      <span>{opt}</span>
                      {selected && isCorrect && <CheckCircle2 size={16} color="#22c55e" />}
                      {selected && isSelected && !isCorrect && <XCircle size={16} color="#6b7280" />}
                    </button>
                  );
                })}
              </div>

              {selected && (
                <div style={s.explanation}>
                  <AlertCircle size={13} color={accent} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{current.explanation}</span>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div style={s.bottomNav}>
          <button style={s.navBtn} onClick={() => setIndex((p) => Math.max(0, p - 1))} disabled={index === 0 || loading}>
            <ChevronLeft size={18} /> Prev
          </button>
          {flagged.size > 0 && (
            <button style={{ ...s.navBtn, color: "#f5a623", borderColor: "#f5a62344" }} onClick={openReview}>
              <Bookmark size={14} /> Review ({flagged.size})
            </button>
          )}
          <button style={{ ...s.navBtn, background: selected ? accent + "22" : "transparent", borderColor: selected ? accent : "#ffffff14", color: selected ? accent : "#444" }} onClick={() => setIndex((p) => p + 1)} disabled={!selected || loading}>
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // REVIEW
  if (screen === "review" && reviewCurrent) {
    const rSelected = reviewAnswers[reviewIndex];
    const accent = topicData?.accent ?? "#e94560";
    return (
      <div style={s.page}>
        <div style={s.quizWrap}>
          <div style={s.quizHeader}>
            <button style={s.back} onClick={() => setScreen("quiz")}><ArrowLeft size={16} /> Quiz</button>
            <div style={{ fontSize: 12, color: "#f5a623" }}>📌 Review {reviewIndex + 1} of {reviewList.length}</div>
            <div style={{ width: 60 }} />
          </div>
          <div style={s.progressBar}>
            <div style={{ ...s.progressFill, background: "#f5a623", width: `${((reviewIndex + 1) / reviewList.length) * 100}%` }} />
          </div>
          <div style={{ fontSize: 12, color: "#444", marginBottom: 12 }}>Review Question {reviewIndex + 1}</div>
          <div style={s.questionBox}>
            <h2 style={s.questionText}>{reviewCurrent.question}</h2>
          </div>
          <div style={s.optionsList}>
            {reviewCurrent.options.map((opt) => {
              const isCorrect = opt === reviewCurrent.answer;
              const isSelected = opt === rSelected;
              let bg = "#ffffff06", border = "#ffffff14", color = "#ccc";
              if (rSelected) {
                if (isCorrect) { bg = "#22c55e22"; border = "#22c55e"; color = "#fff"; }
                else if (isSelected) { bg = "#6b728033"; border = "#6b7280"; color = "#aaa"; }
              }
              return (
                <button key={opt} style={{ ...s.optionBtn, background: bg, borderColor: border, color }} onClick={() => { if (!rSelected) setReviewAnswers((p) => ({ ...p, [reviewIndex]: opt })); }}>
                  <span>{opt}</span>
                  {rSelected && isCorrect && <CheckCircle2 size={16} color="#22c55e" />}
                  {rSelected && isSelected && !isCorrect && <XCircle size={16} color="#6b7280" />}
                </button>
              );
            })}
          </div>
          {rSelected && (
            <div style={s.explanation}>
              <AlertCircle size={13} color={accent} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{reviewCurrent.explanation}</span>
            </div>
          )}
        </div>
        <div style={s.bottomNav}>
          <button style={s.navBtn} onClick={() => setReviewIndex((p) => Math.max(0, p - 1))} disabled={reviewIndex === 0}>
            <ChevronLeft size={18} /> Prev
          </button>
          {reviewIndex + 1 < reviewList.length ? (
            <button style={{ ...s.navBtn, background: rSelected ? accent + "22" : "transparent", borderColor: rSelected ? accent : "#ffffff14", color: rSelected ? accent : "#444" }} onClick={() => setReviewIndex((p) => p + 1)} disabled={!rSelected}>
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button style={{ ...s.navBtn, color: "#f5a623", borderColor: "#f5a62344" }} onClick={() => setScreen("quiz")}>
              Done ✓
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

const s = {
  page: { minHeight: "100vh", background: "#0a0a0a", color: "#eee", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" },
  homeWrap: { maxWidth: 500, margin: "0 auto", padding: "48px 20px 32px", width: "100%" },
  wrap: { maxWidth: 500, margin: "0 auto", padding: "24px 20px", width: "100%", flex: 1 },
  badge: { display: "inline-flex", alignItems: "center", gap: 6, background: "#ffffff0d", border: "1px solid #ffffff18", borderRadius: 99, padding: "4px 12px", fontSize: 12, color: "#666", marginBottom: 20 },
  title: { fontSize: 36, fontWeight: 800, lineHeight: 1.2, letterSpacing: -1, color: "#fff", margin: 0 },
  topicCard: { width: "100%", border: "1px solid", borderRadius: 16, padding: "18px 16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 12, cursor: "pointer", textAlign: "left", background: "none", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" },
  topicEmoji: { fontSize: 28, flexShrink: 0 },
  topicInfo: { flex: 1 },
  topicLabel: { fontWeight: 700, fontSize: 17, color: "#fff", marginBottom: 2 },
  topicDesc: { fontSize: 13, color: "#555" },
  back: { background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4, padding: "4px 0" },
  topicBig: { fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4 },
  subLabel: { fontSize: 14, color: "#555" },
  subtopicCard: { width: "100%", background: "#ffffff06", border: "1px solid", borderRadius: 12, padding: "18px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer", color: "#ccc", fontSize: 15, fontWeight: 500, textAlign: "left", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" },
  input: { width: "100%", background: "#ffffff08", border: "1px solid #ffffff18", borderRadius: 12, padding: "14px 16px", color: "#fff", fontSize: 15, outline: "none", marginBottom: 16, boxSizing: "border-box" },
  startBtn: { width: "100%", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spinner: { width: 36, height: 36, borderRadius: "50%", border: "3px solid #222", borderTop: "3px solid #e94560", margin: "0 auto" },
  quizWrap: { maxWidth: 500, margin: "0 auto", padding: "16px 20px 100px", width: "100%", flex: 1, boxSizing: "border-box" },
  quizHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  progressBar: { height: 3, background: "#ffffff0d", borderRadius: 99, overflow: "hidden", marginBottom: 20 },
  progressFill: { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },
  questionBox: { background: "#ffffff08", border: "1px solid #ffffff0d", borderRadius: 14, padding: "18px 16px", marginBottom: 14 },
  questionText: { fontSize: 18, fontWeight: 700, lineHeight: 1.45, margin: 0, color: "#fff" },
  optionsList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  optionBtn: { border: "1px solid", borderRadius: 11, padding: "13px 15px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", fontSize: 14, fontWeight: 500, transition: "all 0.15s", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" },
  explanation: { display: "flex", gap: 8, alignItems: "flex-start", background: "#ffffff06", border: "1px solid #ffffff0d", borderRadius: 11, padding: "11px 13px", fontSize: 13, color: "#999", lineHeight: 1.5, marginBottom: 16 },
  bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#0a0a0a", borderTop: "1px solid #ffffff0d", padding: "12px 20px", display: "flex", gap: 10 },
  navBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "transparent", border: "1px solid #ffffff14", borderRadius: 10, padding: "11px 14px", color: "#555", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};
