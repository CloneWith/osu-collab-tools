"use client";

import React, { useEffect, useRef } from "react";
import type { Rectangle } from "@/app/imagemap/types";
import { RectangleType } from "@/app/imagemap/types";
import type { IAvatarStyle, AvatarInputs } from "@/app/avatar/styles/IAvatarStyle";
import { isNullOrWhitespace } from "@/lib/utils";
import { snapdom } from "@zumer/snapdom";

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
      style={{
        position: "absolute",
        left: offsetX,
        top: offsetY,
        transformOrigin: "top left",
        transform: `scale(${scale})`,
      }}
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
  cacheRef: React.RefObject<Map<string, { comp: React.FC; signature: string }>>,
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
        cache = {comp: Comp, signature};
        cacheRef.current.set(rect.id, cache);
      }
    } catch {
      return null;
    }
  }
  const AvatarComponent = cache?.comp ?? null;
  return AvatarComponent ? {AvatarComponent, styleObj, inputs} : null;
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
  cacheRef: React.RefObject<Map<string, { comp: React.FC; signature: string }>>;
  measured?: { width: number; height: number };
  onMeasure: (w: number, h: number) => void;
}) {
  const resolved = resolveAvatar(rect, styleRegistry, cacheRef);
  if (!resolved) return null;
  const {AvatarComponent} = resolved;
  const naturalW = measured?.width ?? displayW;
  const naturalH = measured?.height ?? displayH;
  const uniformScale = computeUniformScale(naturalW, naturalH, displayW, displayH);
  const contentW = Math.max(0, naturalW * uniformScale);
  const contentH = Math.max(0, naturalH * uniformScale);
  const offsetX = Math.max(0, (displayW - contentW) / 2);
  const offsetY = Math.max(0, (displayH - contentH) / 2);

  return (
    <div
      key={rect.id}
      style={{
        width: displayW,
        height: displayH,
      }}
      className="overflow-hidden relative"
      onDragStart={(e) => {
        // 如果拖放源来自内部的 img，阻止事件冒泡
        if ((e.target as HTMLElement).tagName === "IMG") {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <MeasuredAvatar rectId={rect.id} onMeasure={onMeasure} scale={uniformScale} offsetX={offsetX} offsetY={offsetY}>
        <AvatarComponent/>
      </MeasuredAvatar>
    </div>
  );
}

export interface RenderableAvatar {
  data: string;
  attrs: Rectangle;
}

import ReactDOM from "react-dom/client";

/**
 * 生成头像组件的 dataURL
 * @param rect 头像区域的 Rectangle 对象
 * @param styleRegistry 头像样式注册表
 * @param cacheRef 头像组件缓存
 * @param measured 测量的头像尺寸（可选）
 * @param onMeasure 尺寸测量回调（可选）
 * @param previewScaleX 预览区的X轴缩放比例（可选）
 * @param previewScaleY 预览区的Y轴缩放比例（可选）
 * @returns 头像组件的 dataURL，失败则返回 null
 */
export async function getAvatarDataURL(
  rect: Rectangle,
  styleRegistry: ReadonlyArray<{ key: string; style: IAvatarStyle }>,
  cacheRef: React.RefObject<Map<string, { comp: React.FC; signature: string }>>,
  measured?: { width: number; height: number },
  onMeasure?: (w: number, h: number) => void,
  previewScaleX?: number,
  previewScaleY?: number,
): Promise<string | null> {
  // 检查是否为可渲染的头像
  if (!isRenderableAvatar(rect)) {
    return null;
  }

  // 如果提供了预览缩放比例，使用与预览区相同的显示逻辑
  let displayW = rect.width;
  let displayH = rect.height;
  
  if (previewScaleX && previewScaleY) {
    // 确保渲染一致性
    displayW = rect.width / previewScaleX;
    displayH = rect.height / previewScaleY;
  }

  // 创建临时容器
  const tempContainer = document.createElement("div");
  tempContainer.className = "export-container";
  tempContainer.style.position = "fixed";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "-9999px";
  tempContainer.style.width = `${displayW}px`;
  tempContainer.style.height = `${displayH}px`;

  document.body.appendChild(tempContainer);

  try {
    // 渲染 AvatarBox 组件到临时容器
    const root = ReactDOM.createRoot(tempContainer);
    
    // 使用与预览区相同的渲染逻辑
    root.render(
      <AvatarBox
        rect={rect}
        displayW={displayW}
        displayH={displayH}
        styleRegistry={styleRegistry}
        cacheRef={cacheRef}
        measured={measured}
        onMeasure={onMeasure || (() => {})}
      />,
    );

    // 等待组件渲染完成并且所有资源加载完毕
    await new Promise<void>((resolve) => {
      const checkResourcesLoaded = (time: number = 0) => {
        const images = tempContainer.querySelectorAll('img');
        const allImagesLoaded = Array.from(images).every(img => {
          return img.complete && img.naturalHeight !== 0;
        });
        
        // 检查字体是否加载完成
        const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

        // 图像已加载 / 超时，按需增加超时限制
        if (allImagesLoaded || time >= 1000) {
          fontsReady.then(() => {
            // 额外等待确保所有渲染完成
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          });
        } else {
          // 继续等待图片加载
          setTimeout(() => checkResourcesLoaded(time + 50), 50);
        }
      };
      
      // 初始等待React渲染完成
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          checkResourcesLoaded();
        });
      });
    });

    const result = await snapdom(tempContainer, {
      // 使用2倍缩放提高质量，但保持组件逻辑尺寸不变
      scale: 2.0,
      backgroundColor: "transparent", 
      embedFonts: true,
      fast: false,
      placeholders: false,
    });

    // 获取 PNG 图像并返回其 dataURL
    const image = await result.toPng();
    return image?.src || null;
  } catch (error) {
    console.error("生成头像 dataURL 失败:", error);
    return null;
  } finally {
    if (tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
}

/**
 * 使用原生 Canvas 方式，生成带有头像组件的合成图像
 * @param backgroundDataURL 背景图像的 dataURL
 * @param avatars 所有需要合成到背景的头像
 * @returns 合成图像的 dataURL，失败则返回 null
 */
export async function generateCompositeImage(
  backgroundDataURL: string,
  avatars: Array<RenderableAvatar>,
): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    try {
      // 加载背景图像以获取尺寸
      const bgImage = new Image();
      bgImage.crossOrigin = "anonymous";
      bgImage.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = bgImage.naturalWidth;
          canvas.height = bgImage.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }

          // 启用HQ渲染
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // 绘制背景图像
          ctx.drawImage(bgImage, 0, 0);

          console.log(`Drawing background: ${bgImage.naturalWidth}x${bgImage.naturalHeight}`);
          console.log(`${avatars.length} avatars will be rendered.`);

          // 加载并绘制所有头像
          const avatarPromises = avatars.map((avatar) => {
            return new Promise<void>((resolveAvatar) => {
              const avatarImage = new Image();
              avatarImage.crossOrigin = "anonymous";
              avatarImage.onload = () => {
                try {
                  // 绘制头像到指定位置和尺寸
                  ctx.drawImage(
                    avatarImage,
                    Math.round(avatar.attrs.x),
                    Math.round(avatar.attrs.y),
                    Math.round(avatar.attrs.width),
                    Math.round(avatar.attrs.height),
                  );
                } catch (error) {
                  console.error("绘制头像失败:", error);
                } finally {
                  resolveAvatar();
                }
              };
              avatarImage.onerror = () => {
                console.warn("Failed to load avatar image:", avatar);
                resolveAvatar();
              };
              console.log(avatar.data);
              avatarImage.src = avatar.data;
            });
          });

          // 等待所有头像绘制完成
          Promise.all(avatarPromises).then(() => {
            // 导出为高质量 PNG（PNG 为无损格式，quality 参数无效）
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
          }).catch(() => {
            resolve(null);
          });
        } catch (error) {
          console.error("生成合成图像失败:", error);
          resolve(null);
        }
      };
      bgImage.onerror = () => {
        resolve(null);
      };
      bgImage.src = backgroundDataURL;
    } catch (error) {
      console.error("生成合成图像失败:", error);
      resolve(null);
    }
  });
}
