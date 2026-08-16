import {
  useInView,
  type IntersectionOptions,
} from "react-intersection-observer";

export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionOptions,
) {
  const { ref: inViewRef, inView } = useInView(options);
  return { ref: inViewRef, isIntersecting: inView };
}
