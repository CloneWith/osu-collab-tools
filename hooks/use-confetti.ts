import { useRef } from "react";

export type TriggerConfettiOptions = {
    className?: string;
    durationMs?: number;
};

interface ConfettiState {
    timer: number | null;
    token: number;
}

export function useConfetti() {
    const confettiStateRef = useRef<WeakMap<HTMLElement, ConfettiState>>(new WeakMap());

    return (el: HTMLElement, options: TriggerConfettiOptions = {}) => {
        const className = options.className ?? "is-confetti-animating";
        const durationMs = options.durationMs ?? 1000;

        const confettiState = confettiStateRef.current;
        const prev = confettiState.get(el) ?? {timer: null, token: 0};
        prev.token += 1;
        const myToken = prev.token;

        if (prev.timer != null) window.clearTimeout(prev.timer);

        // 重启动画：移除 -> reflow -> 添加
        el.classList.remove(className);
        // 强制 reflow，确保动画可以重播
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        el.offsetWidth;
        el.classList.add(className);

        prev.timer = window.setTimeout(() => {
            // 如果这段时间内又触发过，则不清理（让最新那次负责）
            const cur = confettiState.get(el);
            if (!cur || cur.token !== myToken) return;

            el.classList.remove(className);
            cur.timer = null;
            confettiState.delete(el);
        }, durationMs);

        confettiState.set(el, prev);
    };
}
