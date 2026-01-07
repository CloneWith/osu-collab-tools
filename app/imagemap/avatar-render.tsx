"use client";

import React, { useEffect, useRef } from "react";
import type { Rectangle } from "@/app/imagemap/types";
import { RectangleType } from "@/app/imagemap/types";
import type { IAvatarStyle, AvatarInputs } from "@/app/avatar/styles/IAvatarStyle";
import { isNullOrWhitespace } from "@/lib/utils";

// 仅在该模块内部使用的测量容器
export function MeasuredAvatar({
  rectId,
  onMeasure,
  scale,
  offsetX = 0,
  offsetY = 0,
  children,
}: {
  rectId: string;
  onMeasure: (w: number, h: number) => void;
  scale: number;
  offsetX?: number;
  offsetY?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => onMeasure(el.clientWidth, el.clientHeight);
    report();
    const ro = new ResizeObserver(() => report());
    ro.observe(el);
    return () => ro.disconnect();
  }, [rectId, onMeasure]);
  return (
    <div
      ref={ref}
      style={{ position: "absolute", left: offsetX, top: offsetY, transformOrigin: "top left", transform: `scale(${scale})` }}
    >
      {children}
    </div>
  );
}

export const isRenderableAvatar = (rect: Rectangle) =>
  rect.type === RectangleType.Avatar && !!rect.avatar &&
  !isNullOrWhitespace(rect.avatar.imageUrl ?? "") && !isNullOrWhitespace(rect.avatar.username ?? "");

export function resolveAvatar(
  rect: Rectangle,
  styleRegistry: ReadonlyArray<{ key: string; style: IAvatarStyle }>,
  cacheRef: React.MutableRefObject<Map<string, { comp: React.FC; signature: string }>>,
): { AvatarComponent: React.FC; styleObj: IAvatarStyle; inputs: AvatarInputs } | null {
  if (!isRenderableAvatar(rect)) return null;
  const styleObj = styleRegistry.find(s => s.key === (rect.avatar!.styleKey as any))?.style;
  if (!styleObj) return null;
  const inputs: AvatarInputs = {
    imageUrl: rect.avatar!.imageUrl,
    username: rect.avatar!.username,
    countryCode: rect.avatar!.countryCode?.trim() ? rect.avatar!.countryCode.trim().toUpperCase() : undefined,
  };
  const signature = `${rect.avatar!.styleKey}|${inputs.imageUrl}|${inputs.username}|${inputs.countryCode ?? ""}`;
  let cache = cacheRef.current.get(rect.id);
  if (!cache || cache.signature !== signature) {
    try {
      const Comp = styleObj.generateAvatar(inputs);
      if (Comp) {
        cache = { comp: Comp, signature };
        cacheRef.current.set(rect.id, cache);
      }
    } catch {
      return null;
    }
  }
  const AvatarComponent = cache?.comp ?? null;
  return AvatarComponent ? { AvatarComponent, styleObj, inputs } : null;
}

export const computeUniformScale = (
  naturalW: number,
  naturalH: number,
  displayW: number,
  displayH: number,
) => {
  const nw = Math.max(0, naturalW);
  const nh = Math.max(0, naturalH);
  const s = Math.min(nw > 0 ? displayW / nw : 1, nh > 0 ? displayH / nh : 1);
  return Math.max(0, s);
};

export function AvatarBox({
  rect,
  displayW,
  displayH,
  styleRegistry,
  cacheRef,
  measured,
  onMeasure,
}: {
  rect: Rectangle;
  displayW: number;
  displayH: number;
  styleRegistry: ReadonlyArray<{ key: string; style: IAvatarStyle }>;
  cacheRef: React.MutableRefObject<Map<string, { comp: React.FC; signature: string }>>;
  measured?: { width: number; height: number };
  onMeasure: (w: number, h: number) => void;
}) {
  const resolved = resolveAvatar(rect, styleRegistry, cacheRef);
  if (!resolved) return null;
  const { AvatarComponent } = resolved;
  const naturalW = measured?.width ?? displayW;
  const naturalH = measured?.height ?? displayH;
  const uniformScale = computeUniformScale(naturalW, naturalH, displayW, displayH);
  const contentW = Math.max(0, naturalW * uniformScale);
  const contentH = Math.max(0, naturalH * uniformScale);
  const offsetX = Math.max(0, (displayW - contentW) / 2);
  const offsetY = Math.max(0, (displayH - contentH) / 2);

  return (
    <div
      style={{
        width: displayW,
        height: displayH,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <MeasuredAvatar rectId={rect.id} onMeasure={onMeasure} scale={uniformScale} offsetX={offsetX} offsetY={offsetY}>
        <AvatarComponent />
      </MeasuredAvatar>
    </div>
  );
}
