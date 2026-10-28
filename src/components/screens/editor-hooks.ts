"use client";

import { useState, useMemo } from "react";

const PLACEHOLDER_IMAGES = [
  "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/234d79046682.png",
  "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d0ad512486e7.jpg",
  "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d16caf7fdb4c.webp",
  "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3c02bc0d3ea1.jpg",
];

export function useField(initial: string, maxChars?: number) {
  const [value, setValue] = useState(initial);
  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const next = e.target.value;
    if (maxChars && next.length > maxChars) return;
    setValue(next);
  }
  return { value, onChange, setValue };
}

export function useWordCounter(text: string) {
  const count = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [text]);
  return { count };
}

export function useImages(max: number): [string[], never, () => void, (i: number) => void] {
  const [imgs, setImgs] = useState<string[]>([]);

  function addImage() {
    // En prototipo: toma una imagen placeholder cíclica
    const next = PLACEHOLDER_IMAGES[imgs.length % PLACEHOLDER_IMAGES.length];
    setImgs((cur) => (cur.length < max ? [...cur, next] : cur));
  }
  function removeImage(i: number) {
    setImgs((cur) => cur.filter((_, idx) => idx !== i));
  }
  return [imgs, null as never, addImage, removeImage];
}
