import Link from "next/link";
import { HelpCircle } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";

interface HelpIconButtonProps {
  alt?: string;
  section?: string;
  className?: string;
}

export const HelpIconButton: React.FC<HelpIconButtonProps> = ({
                                                                alt = "查看帮助",
                                                                section,
                                                                className,
                                                              }) => (
  <Link aria-label={alt} href={`/docs${section ? "#" + section : ""}`}
        className={cn("transition-all ease-out duration-200 hover:text-accent", className)}>
    <HelpCircle/>
  </Link>
);
