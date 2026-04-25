"use client";

import React, { useState, useRef, useEffect } from "react";

interface OTPInputProps {
  length?: number;
  onChange: (value: string) => void;
  onAutoVerify?: (value: string) => void;
  onError?: (error: string) => void;
  error?: string;
}

const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onChange,
  onAutoVerify,
  onError,
  error,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // Focus the first input on initial render
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (value: string, index: number) => {
    // Allow only digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    // Handle paste
    if (value.length > 1) {
      const pastedOtp = value.slice(0, length).split("");
      for (let i = 0; i < pastedOtp.length; i++) {
        if (i < length) {
          newOtp[i] = pastedOtp[i];
        }
      }
      setOtp(newOtp);
      const otpValue = newOtp.join("");
      onChange(otpValue);

      // Auto-verify if all digits are filled
      if (otpValue.length === length && onAutoVerify) {
        onAutoVerify(otpValue);
      }

      // Focus the last filled input or the next empty one
      const nextIndex = Math.min(pastedOtp.length, length - 1);
      setTimeout(() => {
        if (inputRefs.current[nextIndex]) {
          inputRefs.current[nextIndex]?.focus();
        }
      }, 0);
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);
    const otpValue = newOtp.join("");
    onChange(otpValue);

    // Auto-verify if all digits are filled
    if (otpValue.length === length && onAutoVerify) {
      onAutoVerify(otpValue);
    }

    // Move to next input if current is filled and not the last one
    if (value && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }, 0);
    }
    // Handle arrow keys for navigation
    else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Handle delete key
    else if (e.key === "Delete" && index < length - 1) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      onChange(newOtp.join(""));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "");
    if (pastedData) {
      const newOtp = Array(length).fill("");
      const pasteLength = Math.min(pastedData.length, length);
      for (let i = 0; i < pasteLength; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const otpValue = newOtp.join("");
      onChange(otpValue);

      // Auto-verify if all digits are filled
      if (otpValue.length === length && onAutoVerify) {
        onAutoVerify(otpValue);
      }

      // Focus the last filled input
      const lastIndex = pasteLength - 1;
      setTimeout(() => {
        inputRefs.current[lastIndex]?.focus();
      }, 0);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300 block">
        Verification Code
      </label>
      <div className="flex justify-center gap-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              if (el) inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={handleFocus}
            className={`w-12 h-12 text-center text-lg font-bold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              error
                ? "border-red-500 bg-red-50"
                : digit
                  ? "border-blue-500 bg-blue-50"
                  : "border-white bg-white hover:border-white"
            }`}
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
};

export default OTPInput;
