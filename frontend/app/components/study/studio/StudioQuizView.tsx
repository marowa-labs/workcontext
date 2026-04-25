import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  Maximize2,
  Minimize2,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { StudioItem } from "./types";

interface StudioQuizViewProps {
  item: StudioItem;
  onBack: () => void;
  onDelete?: (id: string) => void;
  onToggleFullscreen?: (item: StudioItem) => void;
  isFullscreen?: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: string;
  category?: string;
}

interface QuizAnswer {
  questionIndex: number;
  selectedOption: number;
  isCorrect: boolean;
}

export function StudioQuizView({
  item,
  onBack,
  onDelete,
  onToggleFullscreen,
  isFullscreen,
}: StudioQuizViewProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
    try {
      return typeof item.content === "string"
        ? JSON.parse(item.content)
        : item.content;
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find((a) => a.questionIndex === currentIndex);
  const score = answers.filter((a) => a.isCorrect).length;
  const totalAnswered = answers.length;
  const percentage =
    totalAnswered > 0 ? ((score / totalAnswered) * 100).toFixed(0) : "0";

  const handleSelectOption = (optionIndex: number) => {
    if (!currentAnswer) {
      setSelectedOption(optionIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || currentAnswer) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    const newAnswer: QuizAnswer = {
      questionIndex: currentIndex,
      selectedOption,
      isCorrect,
    };

    setAnswers([...answers, newAnswer]);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      const nextAnswer = answers.find(
        (a) => a.questionIndex === currentIndex + 1,
      );
      if (nextAnswer) {
        setSelectedOption(nextAnswer.selectedOption);
        setShowExplanation(true);
      } else {
        setSelectedOption(null);
        setShowExplanation(false);
      }
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      const prevAnswer = answers.find(
        (a) => a.questionIndex === currentIndex - 1,
      );
      if (prevAnswer) {
        setSelectedOption(prevAnswer.selectedOption);
        setShowExplanation(true);
      } else {
        setSelectedOption(null);
        setShowExplanation(false);
      }
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowExplanation(false);
    setQuizCompleted(false);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-700 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getScoreColor = () => {
    const pct = parseInt(percentage);
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = () => {
    const pct = parseInt(percentage);
    if (pct >= 90) return "Outstanding! 🎉";
    if (pct >= 80) return "Great job! 🌟";
    if (pct >= 70) return "Well done! 👏";
    if (pct >= 60) return "Good effort! 👍";
    return "Keep studying! 📚";
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span className="cursor-pointer hover:text-gray-600" onClick={onBack}>
            Studio
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900">Quiz</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No quiz available
        </div>
      </div>
    );
  }

  // Quiz Completed View
  if (quizCompleted) {
    return (
      <div
        className={`flex flex-col bg-white ${isFullscreen ? "h-full" : "h-full"}`}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span className="cursor-pointer hover:text-gray-600" onClick={onBack}>
            Studio
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900">Quiz Results</span>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6">
              <Award className="w-20 h-20 mx-auto text-indigo-600 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Quiz Complete!
              </h1>
              <p className="text-lg text-gray-600">{getScoreMessage()}</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 mb-8">
              <div className="text-6xl font-bold mb-2 ${getScoreColor()}">
                {percentage}%
              </div>
              <div className="text-gray-600 text-lg">
                {score} out of {questions.length} correct
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white border-2 border-green-200 rounded-xl p-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{score}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="bg-white border-2 border-red-200 rounded-xl p-4">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {questions.length - score}
                </div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleReset}
                className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
              <Button variant="outline" onClick={onBack}>
                Back to Studio
              </Button>
            </div>

            {/* Question Review */}
            <div className="mt-12 text-left">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Question Review
              </h2>
              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const answer = answers.find((a) => a.questionIndex === idx);
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${answer?.isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                      <div className="flex items-start gap-3">
                        {answer?.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">
                            Question {idx + 1}
                          </div>
                          <div className="text-sm text-gray-700">
                            {q.question}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Question View
  return (
    <div
      className={`flex flex-col bg-white ${isFullscreen ? "h-full" : "h-full"} animate-in slide-in-from-right-4 duration-200`}>
      {/* Breadcrumbs */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <span
          className="cursor-pointer hover:text-gray-600 transition-colors"
          onClick={onBack}>
          Studio
        </span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 truncate max-w-[140px]">Quiz</span>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">
            Question {currentIndex + 1} / {questions.length}
          </span>
          <span className="mx-1 text-gray-300">•</span>
          <span className="text-xs text-gray-600">
            Score: {score}/{totalAnswered}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-blue-600"
            onClick={handleReset}
            title="Reset Quiz">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => onDelete?.(item.id)}
            title="Delete Quiz">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400"
            onClick={() => onToggleFullscreen?.(item)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-gray-500 w-8">
            {Math.round(((currentIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Question Metadata */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {currentQuestion.category && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                  {currentQuestion.category}
                </span>
              )}
            </div>
            {currentQuestion.difficulty && (
              <span
                className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${getDifficultyColor(currentQuestion.difficulty)}`}>
                {currentQuestion.difficulty}
              </span>
            )}
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
              {currentQuestion.question}
            </h2>
            {currentAnswer && (
              <div
                className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${currentAnswer.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {currentAnswer.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Correct!
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Incorrect
                  </>
                )}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correctAnswer;
              const showCorrect = currentAnswer && isCorrect;
              const showIncorrect = currentAnswer && isSelected && !isCorrect;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={!!currentAnswer}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    showCorrect
                      ? "border-green-500 bg-green-50"
                      : showIncorrect
                        ? "border-red-500 bg-red-50"
                        : isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50"
                  } ${currentAnswer ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-semibold ${
                        showCorrect
                          ? "border-green-500 bg-green-500 text-white"
                          : showIncorrect
                            ? "border-red-500 bg-red-500 text-white"
                            : isSelected
                              ? "border-indigo-500 bg-indigo-500 text-white"
                              : "border-gray-300 text-gray-600"
                      }`}>
                      {showCorrect ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : showIncorrect ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        String.fromCharCode(65 + idx)
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl mb-6">
              <div className="font-semibold text-blue-900 mb-2">
                Explanation:
              </div>
              <p className="text-blue-800 text-sm leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {!currentAnswer ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Submit Answer
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {currentIndex === questions.length - 1
                  ? "View Results"
                  : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
