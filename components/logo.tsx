"use client";

import { Aperture } from "lucide-react";
import { useEffect, useRef } from "react";
import { animate, createScope, Scope } from "animejs";

export default function Logo() {
  const root = useRef(null);
  const scope = useRef<Scope>(null);

  useEffect(() => {
    scope.current = createScope({root}).add(self => {
      self?.add("rotateLogo", (reverse: boolean = false) => {
          animate(".logo", {
            rotate: 360 * (reverse ? 0 : 2),
            ease: "inOutBack(0.75)",
            duration: 1000,
          });
        },
      );
    });

    return () => scope.current!.revert();
  }, []);

  return (
    <div ref={root} className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
         onPointerOver={() => scope.current?.methods.rotateLogo()}
         onPointerLeave={() => scope.current?.methods.rotateLogo(true)}
    >
      <Aperture className="logo w-5 h-5 text-primary-foreground"/>
    </div>
  );
}
