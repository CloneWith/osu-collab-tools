import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import type React from "react";

interface HelpIconButtonProps {
  section?: string;
  className?: string;
}

export const HelpIconButton: React.FC<HelpIconButtonProps> = ({
  section,
  className,
}) => (
  <Link
    aria-label="Help Button"
    href={`/docs${section ? `#${section}` : ""}`}
    className={cn(
      "transition-all ease-out duration-200 hover:text-accent",
      className,
    )}
  >
    <HelpCircle />
  </Link>
);
