import Link from "next/link";
import { HelpCircle } from "lucide-react";
import type React from "react";

interface HelpIconButtonProps {
  alt?: string;
  section?: string;
  className?: string;
}

export const HelpIconButton: React.FC<HelpIconButtonProps> = ({
                                                                alt = "查看帮助",
                                                                section,
                                                                className,
                                                              }) => {
  return (
    <Link aria-label={alt} href={`/docs${section ? "#" + section : ""}`}
          className={`transition-all ease-out duration-200 hover:text-accent ${className}`}>
      <HelpCircle/>
    </Link>
  );
};