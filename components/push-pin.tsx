"use client";

/**
 * A realistic push-pin used to "pin" sticky notes. When not pinned it renders a
 * large, obvious dashed ghost target inviting a tap. Sizes are configurable so
 * the same pin reads large in the editor and proportionally on board cards.
 */
export function PushPin({
  pinned,
  size = 30,
  onClick,
  as = "button",
}: {
  pinned: boolean;
  size?: number;
  onClick?: () => void;
  as?: "button" | "div";
}) {
  const head = size;
  const needle = Math.max(4, size * 0.42);
  const inner = (
    <>
      {pinned ? (
        <>
          <div
            style={{
              width: head,
              height: head,
              borderRadius: "50%",
              background: "radial-gradient(circle at 34% 30%, #ff7a7a 0%, #ef4444 42%, #b91c1c 100%)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.5)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: head * 0.22,
                left: head * 0.26,
                width: head * 0.26,
                height: head * 0.18,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.55)",
              }}
            />
          </div>
          <div
            style={{
              width: Math.max(2, size * 0.1),
              height: needle,
              background: "linear-gradient(180deg,#aaa,#777)",
              margin: "0 auto",
              borderRadius: 2,
              boxShadow: "1px 1px 2px rgba(0,0,0,0.25)",
            }}
          />
        </>
      ) : (
        <div
          style={{
            width: head,
            height: head,
            borderRadius: "50%",
            border: "2.5px dashed rgba(0,0,0,0.22)",
            background: "rgba(0,0,0,0.03)",
          }}
        />
      )}
    </>
  );

  if (as === "div") {
    return <div className="relative flex flex-col items-center">{inner}</div>;
  }
  return (
    <button
      onClick={onClick}
      aria-label={pinned ? "Unpin" : "Pin"}
      className="relative flex flex-col items-center transition-transform active:scale-90"
    >
      {inner}
    </button>
  );
}
