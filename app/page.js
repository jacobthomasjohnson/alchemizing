"use client";

import { supabaseClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { Blend } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import confetti from "canvas-confetti";

export default function Home() {
  const devmode = true;

  const { user, setUser } = useAuthStore();
  const INITIAL_GUESSES = 3;
  const [guessesRemaining, setGuessesRemaining] = useState(INITIAL_GUESSES);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientsLoaded, setIngredientsLoaded] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [textResponse, setTextResponse] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(null);
  const [results, setResults] = useState(null);
  const [textResponseKey, setTextResponseKey] = useState(0);

  const resetGame = () => {
    window.location.reload();
  };

  const winGame = () => {
    submitAnswer({ autoWin: true });
  };

  useEffect(() => {
    if (ingredientsLoaded === false) {
      setTimeout(() => {
        setIngredients([
          "Phosphoric acid",
          "Caffeine",
          "Caramel Color",
          "Citric Acid",
          "Sodium Benzoate",
          "Aspertame",
          "Acacia Gum",
          "Potassium Sorbate",
        ]);
        setIngredientsLoaded(true);
      }, 140);
    }
  }, []);

  const correctIngredients = [
    "Phosphoric acid",
    "Caffeine",
    "Caramel Color",
    "Sodium Benzoate",
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabaseClient.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };

    getUser();

    const { data: listener } = supabaseClient.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription?.unsubscribe();
    };
  }, [setUser]);

  const signInWithGoogle = () => {
    supabaseClient.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      const isAlreadySelected = prev.includes(item);

      if (isAlreadySelected) {
        return prev.filter((i) => i !== item);
      } else if (prev.length < 4) {
        return [...prev, item];
      } else {
        console.log("You can only select up to 4 items.");
        return prev;
      }
    });
  };

  const submitAnswer = ({ autoWin = false }) => {
    const correctAnswers = selectedItems.filter((item) =>
      correctIngredients.includes(item)
    );
    let amountOfCorrectAnswers = correctAnswers.length;
    console.log(`correctAnswers: ${correctAnswers}`);
    const wrongAnswers = selectedItems.filter(
      (item) => !correctIngredients.includes(item)
    );
    const amountOfWrongAnswers = wrongAnswers.length;

    if (amountOfCorrectAnswers === 4 || autoWin) {
      confetti({
        particleCount: 150,
        angle: 90, // shoots straight up
        spread: 50,
        startVelocity: 75,
        gravity: 1.5,
        ticks: 110, // short lifespan
        scalar: 0.3, // smaller particles
        origin: { x: 0.5, y: 1 }, // bottom center
        colors: ["#ffd9ec", "#d0f0ff"], // light pink + light blue
      });
      setGameWin(true);
      setGameOver(true);
      return;
    }

    if (selectedItems.length < 4) {
      setTextResponse(
        <span key={textResponseKey} className="flash-text">
          PLEASE SELECT FOUR ITEMS.
        </span>
      );
      setTextResponseKey((prev) => prev + 1); // trigger rerender of span
      setSelectedItems([]);
      return;
    }

    console.log(`wrongAnswers: ${wrongAnswers}`);
    setGuessesRemaining(guessesRemaining - 1);
    console.log(`guessesRemaining: ${guessesRemaining - 1}`);
    setSelectedItems([]);

    setTextResponse(
      <>
        There were{" "}
        <span className="text-sky-200">{amountOfCorrectAnswers}</span> correct
        and <span className="text-red-300">{amountOfWrongAnswers}</span> wrong.
      </>
    );

    if (guessesRemaining === 1) {
      setGameWin(false);
      setGameOver(true);
      return;
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-12">
      <motion.header
        initial={{
          translateY: -100,
        }}
        animate={{
          translateY: 0,
        }}
        className="w-full flex justify-between p-6 items-center"
      >
        <div className="text-neutral-300 font-mono uppercase text-xs">
          Alchemiz.ing
        </div>
        {user && (
          <button
            className="p-2 border rounded-lg border-neutral-800 hover:bg-neutral-900 transition-colors duration-75 hover:cursor-pointer text-xs"
            onClick={() => supabaseClient.auth.signOut()}
          >
            Sign Out
          </button>
        )}
        {!user && (
          <button
            className="hover:cursor-pointer grayscale hover:grayscale-0 transition-all"
            onClick={signInWithGoogle}
          >
            <Image
              src="/google-signin.svg"
              width={130}
              height={40}
              alt="Sign In with Google"
            />
          </button>
        )}
      </motion.header>
      <div className="game-container p-6 py-0">
        {gameOver && (
          <AnimatePresence>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                duration: 0.2,
                easing: "circOut",
              }}
            >
              {gameWin ? <>Nice job!</> : <>You lost!</>}
              {results}
            </motion.div>
          </AnimatePresence>
        )}
        {ingredientsLoaded && !gameOver && (
          <AnimatePresence>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                duration: 0.2,
                easing: "circOut",
              }}
            >
              <div className="w-full p-4 rounded-lg flex justify-center gap-4 items-center word-container">
                <span className="text-neutral-950 text-xs font-mono font-semibold uppercase">
                  Coca-Cola
                </span>
              </div>

              <div
                className={`text-neutral-500 text-xs wrap-break-word w-full font-mono py-3 text-center leading-6 uppercase 
                  
                `}
              >
                {textResponse === null
                  ? "YOU HAVE " +
                    INITIAL_GUESSES +
                    " GUESSES TO IDENTIFY THE FOUR ITEMS THAT ARE FOUND IN THIS."
                  : textResponse}
              </div>
              <div className="items-list flex flex-col items-center justify-center gap-1 text-xs font-mono">
                {ingredients.map((item, i) => {
                  const isSelected = selectedItems.includes(item);

                  return (
                    <div
                      key={i}
                      className={`p-4 border font-inter w-full rounded-lg uppercase transition-colors duration-75 
        ${isSelected ? "border-[#b7d4db] bg-[#101010]" : "border-neutral-800"}`}
                      onClick={() => toggleItem(item)}
                    >
                      {item}
                      {item.correct && <>Correct</>}
                    </div>
                  );
                })}
              </div>
              <div
                className={`text-neutral-400 text-xs wrap-break-word w-full font-mono text-center uppercase my-3 
                  
                `}
              ></div>
              <button
                onClick={submitAnswer}
                className="flex items-center justify-center gap-2 p-4 border border-neutral-600 text-neutral-300 border-dashed font-mono w-full rounded-lg uppercase text-xs transition-colors duration-150 hover:border-neutral-500 hover:text-neutral-100"
              >
                Submit Answer
                <Blend width={12} height={12} />({guessesRemaining} Guesses
                Remaining)
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      {devmode && (
        <div className="fixed bottom-0 w-full max-w-xl mx-auto p-6 border border-b-0 border-neutral-700 rounded-t-lg text-xs flex gap-2 uppercase font-mono items-center">
          DEVELOPMENT MENU:
          <button
            className="p-2 border border-neutral-800 rounded-sm uppercase"
            onClick={resetGame}
          >
            RESET GAME
          </button>
          <button
            className="p-2 border border-neutral-800 rounded-sm uppercase"
            onClick={winGame}
          >
            WIN GAME
          </button>
        </div>
      )}
    </div>
  );
}
