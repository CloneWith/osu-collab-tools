import { Aperture } from "lucide-react";

export default function Logo() {
  return (
    <div className="group w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
      <Aperture className="w-5 h-5 text-primary-foreground transition-transform duration-1000 ease-[cubic-bezier(0.666,-0.174,0.334,1.174)] group-hover:rotate-720 motion-reduce:transition-none" />
    </div>
  );
}
