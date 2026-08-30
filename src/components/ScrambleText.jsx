import useScramble from "../hooks/useScramble";

// B&W minimalist scramble — mono, no color, just decode
export default function ScrambleText({ text, as: Tag = "span", className = "", ...rest }) {
  const { ref, onEnter, onLeave } = useScramble(text);
  return (
    <Tag
      ref={ref}
      className={`scramble ${className}`}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onMouseLeave={onLeave}
      onBlur={onLeave}
      {...rest}
    >
      {text}
    </Tag>
  );
}
