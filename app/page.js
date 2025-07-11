"use client";

import { useEffect, useState, useRef } from "react";
import { supabaseClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Blend, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ResultsCopyButton from "@/components/ResultsCopyButton";
import { shuffleArray } from "@/utils/algorithms";
import dynamicConfetti from "@/utils/confetti";

export default function Home() {
  const { user, setUser } = useAuthStore();
  const INITIAL_GUESSES = 3;

  // Game state
  const [devMode, setDevMode] = useState(false);
  const [guessesRemaining, setGuessesRemaining] = useState(INITIAL_GUESSES);
  const [guessData, setGuessData] = useState([]);
  const [emojiResults, setEmojiResults] = useState([]);

  const [prompt, setPrompt] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [ingredientsLoaded, setIngredientsLoaded] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [correctIngredients, setCorrectIngredients] = useState([]);

  const [textMessage, setTextMessage] = useState(null);
  const [flashKey, setFlashKey] = useState(0);

  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(null);

  const [feedbackMap, setFeedbackMap] = useState({});
  const [expandedResults, setExpandedResults] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const resultsRef = useRef(null);

  // Header measuring
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Measure header height
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  // ── Supabase ──────────────────────────────────────────────────────────────

  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
    const { data: listener } = supabaseClient.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [setUser]);

  // ── Game Init ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchDailyGame = async () => {
      const today = new Date().toISOString().slice(0, 10);

      console.log(today);

      const { data, error } = await supabaseClient
        .from("daily_games")
        .select("*")
        .eq("date", today)
        .maybeSingle();

      if (error) {
        console.error("Error loading daily game:", error.message);
        setTextMessage("Failed to load today's puzzle.");
        return;
      }

      if (!data) {
        console.warn("No daily game found for today.");
        setTextMessage("No puzzle found for today.");
        return;
      }

      setPrompt(data.prompt);
      setCorrectIngredients(data.correct_ingredients);
      setIngredients(shuffleArray(data.ingredients));
      setIngredientsLoaded(true);
    };

    if (!ingredientsLoaded) fetchDailyGame();
  }, [ingredientsLoaded]);

  useEffect(() => {
    if(user) {
      // Save results to user's database.
    } else {
      // Store results in case user signs in.
      // Otherwise, save to local storage?
    }
  }, [gameOver]);

  // ── Header Anim Space ─────────────────────────────────────────────────────

  useEffect(() => {
    if (resultsRef.current) {
      setContentHeight(resultsRef.current.scrollHeight);
    }
  }, [guessData, expandedResults]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const signInWithGoogle = () =>
    supabaseClient.auth.signInWithOAuth({ provider: "google" });
  const resetGame = () => window.location.reload();
  const winGame = () => submitAnswer({ autoWin: true });

  const toggleItem = (item) =>
    setSelectedItems((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : prev.length < 4
        ? [...prev, item]
        : prev
    );

  const submitAnswer = ({ autoWin = false } = {}) => {
    if (autoWin) {
      setGameWin(true);
      setGameOver(true);
      dynamicConfetti();
      return;
    }

    if (selectedItems.length < 4) {
      setTextMessage("PLEASE SELECT FOUR ITEMS.");
      setFlashKey((f) => f + 1);
      setSelectedItems([]);
      return;
    }

    const correctAnswers = selectedItems.filter((i) =>
      correctIngredients.includes(i)
    );
    const wrongAnswers = selectedItems.filter(
      (i) => !correctIngredients.includes(i)
    );
    const amountOfCorrect = correctAnswers.length;
    const amountOfWrong = wrongAnswers.length;

    const newMap = {};
    correctAnswers.forEach((item) => (newMap[item] = "correct"));
    wrongAnswers.forEach((item) => (newMap[item] = "wrong"));
    setFeedbackMap(newMap);

    setTimeout(() => {
      setFeedbackMap({});
      setIngredients((prev) => shuffleArray(prev));
    }, 1000);

    const newGuess = {
      correctAnswers,
      amountOfCorrectAnswers: amountOfCorrect,
      wrongAnswers,
      amountOfWrongAnswers: amountOfWrong,
    };
    setGuessData((g) => [...g, newGuess]);
    setEmojiResults((e) => [
      ...e,
      "🧪 " +
        selectedItems
          .map((i) => (correctIngredients.includes(i) ? "🟩" : "🟥"))
          .join(""),
    ]);

    if (amountOfCorrect === 4) {
      setGameWin(true);
      setGameOver(true);
      setTimeout(() => {
        dynamicConfetti();
      }, 200);

      return;
    }

    setGuessesRemaining((g) => g - 1);
    setSelectedItems([]);
    setTextMessage(
      <>
        There were <span className="text-sky-200">{amountOfCorrect}</span>{" "}
        correct and <span className="text-red-300">{amountOfWrong}</span> wrong.
      </>
    );

    if (guessesRemaining === 1) {
      setGameWin(false);
      setGameOver(true);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-xl mx-auto mb-12">
      {/* HEADER */}
      <motion.header
        ref={headerRef}
        className="fixed w-full max-w-xl mx-auto inset-x-0 top-0 flex justify-between items-center p-4 z-10 backd"
        style={{
          background:
            "linear-gradient(to bottom, #0a0a0a 45%, transparent 100%)",
        }}
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 2, ease: [0, 1, 0, 1] }}
      >
        <div className="text-neutral-300 font-mono uppercase text-xs">
          Alchemiz.ing
        </div>

        {user ? (
          <button
            onClick={() => supabaseClient.auth.signOut()}
            className="px-3 py-1 border border-neutral-800 rounded-lg text-xs text-neutral-300 hover:bg-neutral-800 transition"
          >
            Sign Out
          </button>
        ) : (
          <button onClick={signInWithGoogle} className="">
            <div style={{ position: "relative", width: 145, height: 36 }}>
              <Image
                src="/web_dark_sq_ctn.svg"
                alt="Sign in with Google"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          </button>
        )}
      </motion.header>

      {/* PLACEHOLDER to push content down */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: headerHeight }}
        transition={{ duration: 0.6, ease: [0, 1, 0, 1] }}
      />

      {/* GAME + RESULTS */}
      <div className="game-container p-4 py-0">
        {gameOver ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.5, ease: "circOut" }}
            >
              {gameWin && (
                <div className="mb-4 rounded-lg p-[1px] bg-gradient-to-bl from-[#a4ccff] to-[#d7acfc]">
                  <div className="font-mono text-center text-blue-200 bg-neutral-950 rounded-lg p-4 leading-5">
                    Nicely done! 😁
                  </div>
                </div>
              )}
              {!gameWin && (
                <div className="mb-4 rounded-lg p-[1px] bg-gradient-to-bl from-[#f0d1ff] to-[#80c7bf]">
                  <div className="font-mono text-center text-red-200 bg-neutral-950 rounded-lg p-4 leading-5">
                    Better luck next time! 🙁
                  </div>
                </div>
              )}

              {/* Shareable + copy */}
              {emojiResults.length > 0 && (
                <div className="mt-8 font-mono text-sm text-neutral-400">
                  <div className="mb-4 uppercase text-xs text-neutral-500">
                    Shareable Results:
                  </div>

                  {/* 1px wrapper + gradient background + rounded corners */}
                  <div className="mb-4 rounded-lg p-[1px] bg-gradient-to-t from-[#2b2b2b] to-[#383838]">
                    {/* actual pre, with the same border-radius to line up */}
                    <pre className="whitespace-pre-wrap bg-neutral-950 rounded-lg p-4 leading-5">
                      My www.alchemiz.ing results from today:
                      {"\n\n"}
                      {emojiResults.join("\n")}
                    </pre>
                  </div>

                  <ResultsCopyButton
                    textToCopy={`My www.alchemiz.ing results from today:\n\n${emojiResults.join(
                      "\n"
                    )}`}
                  />
                </div>
              )}

              {/* Expand toggle */}
              <div
                className={`flex gap-1 mt-8 font-mono text-xs uppercase cursor-pointer mb-2 transition-colors ${
                  expandedResults ? "text-neutral-200" : "text-neutral-500"
                }`}
                onClick={() => setExpandedResults((r) => !r)}
              >
                <ChevronRight
                  width={14}
                  height={14}
                  className={`transition-transform duration-100 ${
                    expandedResults ? "rotate-90" : "rotate-0"
                  }`}
                />
                VIEW DETAILED RESULTS
              </div>

              {/* Animated detailed results panel */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: expandedResults ? contentHeight : 0 }}
                transition={{ duration: 0.3, ease: [0, 1, 0, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div
                  ref={resultsRef}
                  className="font-mono text-xs text-neutral-200"
                >
                  {guessData.map((guess, i) => (
                    <div key={i} className="py-4">
                      <div className="uppercase text-xs text-neutral-300 mb-1">
                        Attempt {i + 1}:
                      </div>
                      <div className="flex flex-col gap-1">
                        {guess.correctAnswers.map((item, j) => (
                          <div
                            key={`c-${i}-${j}-${item.trim()}`}
                            className="text-green-300"
                          >
                            ✓ {item}
                          </div>
                        ))}
                        {guess.wrongAnswers.map((item, j) => (
                          <div
                            key={`w-${i}-${j}-${item.trim()}`}
                            className="text-red-300"
                          >
                            ✕ {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="text-xs text-neutral-500 mt-4 uppercase">
                    You had{" "}
                    {guessesRemaining === 0
                      ? "no guesses"
                      : 1
                      ? "1 guess"
                      : guessesRemaining + " guesses"}{" "}
                    remaining.
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            {ingredientsLoaded && (
              <motion.div
                key="game"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ scale: 0, position: "fixed" }}
                transition={{ duration: 1, ease: [0, 1, 0, 1] }}
              >
                <div className="w-full p-4 rounded-lg flex justify-center items-center word-container">
                  <span className="text-neutral-950 text-xs font-mono font-semibold uppercase">
                    {prompt}
                  </span>
                </div>

                <div
                  key={flashKey}
                  className={`text-neutral-500 text-xs w-full font-mono py-3 text-center uppercase ${
                    textMessage ? "flash-text" : ""
                  }`}
                >
                  {textMessage || "FIND THE FOUR VALID INGREDIENTS IN THREE GUESSES."}
                </div>

                <div className="flex flex-col items-center gap-1 text-xs font-mono">
                  {ingredients.map((item, i) => {
                    const isSel = selectedItems.includes(item);
                    const feedback = feedbackMap[item]; // "correct" | "wrong" | undefined

                    const baseBorder = isSel
                      ? "border-[#b7d4db]"
                      : "border-neutral-800";
                    const baseBg = isSel ? "bg-[#101010]" : "bg-neutral-950";
                    const textColor =
                      feedback === "correct"
                        ? "text-background"
                        : feedback === "wrong"
                        ? "text-background"
                        : "text-neutral-300";
                    const borderColor =
                      feedback === "correct"
                        ? "border-green-300"
                        : feedback === "wrong"
                        ? "border-red-300"
                        : baseBorder;
                    const highlightBg =
                      feedback === "correct"
                        ? "bg-green-200/70"
                        : feedback === "wrong"
                        ? "bg-red-200/70"
                        : "opacity-0";

                    return (
                      <motion.div
                        layout
                        key={item}
                        className="w-full"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      >
                        <div
                          key={i}
                          onClick={() => toggleItem(item)}
                          className={`relative w-full p-4 rounded-lg uppercase border font-mono 
                        transition-all duration-75 ease-[cubic-bezier(0.4,0,0.2,1)] 
                        ${borderColor} ${textColor} ${baseBg}`}
                        >
                          <div
                            className={`
                          absolute inset-0 z-0 rounded-lg pointer-events-none
                          transition-all duration-200 ${highlightBg}
                        `}
                          />
                          <div className="relative z-10">{item}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <button
                  onClick={submitAnswer}
                  className="flex items-center justify-center gap-2 p-4 w-full mt-4 border border-neutral-600 border-dashed rounded-lg text-xs font-mono text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition"
                >
                  Submit Answer
                  <Blend width={12} height={12} />({guessesRemaining} Guesses
                  Remaining)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {devMode && (
        <div className="fixed bottom-0 inset-x-0 max-w-xl mx-auto bg-background p-6 border-t border-neutral-700 text-xs font-mono uppercase flex gap-2 items-center">
          <button
            onClick={resetGame}
            className="px-2 py-1 border border-neutral-800 rounded-sm"
          >
            RESET
          </button>
          <button
            onClick={winGame}
            className="px-2 py-1 border border-neutral-800 rounded-sm"
          >
            WIN
          </button>
          <button
            onClick={() => setDevMode(false)}
            className="px-2 py-1 border border-neutral-800 rounded-sm"
          >
            CLOSE
          </button>
        </div>
      )}
    </div>
  );
}
