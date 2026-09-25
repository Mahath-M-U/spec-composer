import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { imageStatusOf, type ImageStatus } from "@/lib/image-status";

/**
 * Tracks the load state of an <img>. Starts as "loading" on server and client
 * alike (hydration-safe) and re-checks the element after mount so loads or
 * errors that finished before hydration are not missed.
 */
export function useImageStatus(src: string | undefined): {
  ref: RefObject<HTMLImageElement | null>;
  status: ImageStatus;
  onLoad: () => void;
  onError: () => void;
} {
  const ref = useRef<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<ImageStatus>("loading");

  useEffect(() => {
    setStatus(imageStatusOf(ref.current));
  }, [src]);

  const onLoad = useCallback(() => setStatus("loaded"), []);
  const onError = useCallback(() => setStatus("error"), []);

  return { ref, status, onLoad, onError };
}
