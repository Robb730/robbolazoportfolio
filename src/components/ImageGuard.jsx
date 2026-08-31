import { useEffect } from "react";

export default function ImageGuard() {
  useEffect(() => {
    const blockDrag = (e) => {
      const t = e.target;
      // block any drag that originates from an image, canvas, or its wrapper
      if (
        t instanceof HTMLImageElement ||
        t instanceof HTMLCanvasElement ||
        (t.closest && t.closest("img, canvas, [data-protected]"))
      ) {
        e.preventDefault();
      }
    };

    const blockContextOnImage = (e) => {
      // Hard-block the browser's native "Save image as / Open in new tab"
      // when the target is an image. preventDefault kills the native menu.
      // Don't stopPropagation — let the custom ContextMenu still show.
      const t = e.target;
      const isImage =
        t instanceof HTMLImageElement ||
        (t.closest && t.closest("img, [data-protected-image]"));
      if (isImage) {
        e.preventDefault();
      }
    };

    // Global drag / touch-callout / selection blocks for images
    document.addEventListener("dragstart", blockDrag, true);
    document.addEventListener("contextmenu", blockContextOnImage, true);

    // Also set draggable=false on all current + future imgs
    const harden = (root = document) => {
      root.querySelectorAll?.("img").forEach((img) => {
        img.setAttribute("draggable", "false");
        img.style.setProperty("-webkit-user-drag", "none", "important");
        img.style.setProperty("user-select", "none", "important");
        img.style.setProperty("-webkit-user-select", "none", "important");
        img.style.setProperty("-webkit-touch-callout", "none", "important");
        // also block native drag handlers
        img.ondragstart = (e) => e.preventDefault();
      });
    };
    harden();

    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (n.tagName === "IMG") harden(document);
          else if (n.querySelectorAll) harden(n);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("dragstart", blockDrag, true);
      document.removeEventListener("contextmenu", blockContextOnImage, true);
      mo.disconnect();
    };
  }, []);

  return (
    <style>{`
      /* Make images non-selectable / non-draggable at CSS level */
      img {
        -webkit-user-drag: none !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      /* Transparent hit-area overlay helper — apply via data attribute if you need hard block */
      [data-protected-image] {
        position: relative;
      }
      [data-protected-image]::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        /* absorbs drag/context but lets clicks through via JS */
        pointer-events: none;
      }
    `}</style>
  );
}
