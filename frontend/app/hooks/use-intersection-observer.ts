import { useInView } from "react-intersection-observer";

export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverOptions,
) {
  const [isIntersecting, setIsIntersecting] = useInView(options);
  return { isIntersecting, setIsIntersecting };
}
