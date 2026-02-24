"use client";

import React, { useRef, useState } from "react";
import { Button } from "./button";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/use-confetti";
import { useTranslations } from "next-intl";
import { cn, debounce } from "@/lib/utils";

interface CopyButtonProps {
  /**
   * The text to write to the clipboard.
   */
  text: string;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  className?: string;

  /**
   * Called when the specified content is successfully copied.
   */
  onCopySuccess?: () => void;
}


/**
 * A generic copy button with confetti feedback.
 */
export function CopyButton({
                             text,
                             children,
                             variant = "default",
                             className = "",
                             onCopySuccess,
                           }: CopyButtonProps) {
  const t = useTranslations("common");
  const triggerConfetti = useConfetti();
  const {toast} = useToast();
  const copyBtnRef = useRef<HTMLButtonElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const resetCopySuccess = useRef(debounce(() => {
    setCopySuccess(false);
  }, 1500)).current;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);

      // Set copy success state to trigger animation
      setCopySuccess(true);

      // Reset after animation completes
      resetCopySuccess();

      // Confetti feedback
      if (copyBtnRef.current) triggerConfetti(copyBtnRef.current);

      if (onCopySuccess) onCopySuccess();
    } catch (error) {
      toast({
        title: t("copyError"),
        description: t("copyErrorDescription"),
      });
    }
  };

  return (
    <Button
      ref={copyBtnRef}
      variant={variant}
      onClick={handleCopy}
      className={cn("gap-2 confetti-button", className)}
    >
      <div
        className={`relative transition-all duration-300 ${copySuccess ? "scale-125 opacity-100" : "scale-100 opacity-100"}`}>
        <Copy
          className={`w-4 h-4 absolute transition-opacity duration-300 ${copySuccess ? "opacity-0" : "opacity-100"}`}/>
        <Check className={`w-4 h-4 transition-opacity duration-300 ${copySuccess ? "opacity-100" : "opacity-0"}`}/>
      </div>
      {children || t("copy")}
    </Button>
  );
}
