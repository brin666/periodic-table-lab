export interface ViewportSnapshot {
  dataUrl: string;
  width: number;
  height: number;
}

export interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MAX_EDGE = 1600;
const MAX_BYTES = 2 * 1024 * 1024;

function canvasBytes(dataUrl: string) {
  const encoded = dataUrl.split(",", 2)[1] ?? "";
  return (
    Math.floor((encoded.length * 3) / 4) -
    (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0)
  );
}

function canvasToBoundedDataUrl(source: HTMLCanvasElement): ViewportSnapshot {
  let width = source.width;
  let height = source.height;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));

  if (scale < 1) {
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const output = document.createElement("canvas");
  const context = output.getContext("2d");
  if (!context) throw new Error("无法创建截图画布。");

  const encode = () => {
    output.width = width;
    output.height = height;
    context.drawImage(source, 0, 0, width, height);
    let dataUrl = output.toDataURL("image/png");
    if (canvasBytes(dataUrl) <= MAX_BYTES) return dataUrl;

    for (const quality of [0.92, 0.86, 0.8, 0.74, 0.68]) {
      dataUrl = output.toDataURL("image/jpeg", quality);
      if (canvasBytes(dataUrl) <= MAX_BYTES) return dataUrl;
    }

    return null;
  };

  let dataUrl = encode();
  while (!dataUrl && Math.max(width, height) > 480) {
    width = Math.max(1, Math.round(width * 0.86));
    height = Math.max(1, Math.round(height * 0.86));
    dataUrl = encode();
  }

  if (!dataUrl) throw new Error("截图体积过大，请缩小选区后重试。");
  return { dataUrl, width, height };
}

export async function captureViewport(): Promise<ViewportSnapshot> {
  const width = Math.max(1, Math.round(window.innerWidth));
  const height = Math.max(1, Math.round(window.innerHeight));
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const markerName = "data-feedback-capture-node";
  const layout = [...document.querySelectorAll<HTMLElement>("body *")]
    .filter((node) => !node.closest("[data-feedback-ui]"))
    .flatMap((node, index) => {
      const computed = getComputedStyle(node);
      const fixed = computed.position === "fixed";
      const modal =
        node instanceof HTMLDialogElement &&
        node.open &&
        node.matches(":modal");
      const scrollable = /auto|scroll/.test(
        `${computed.overflowX} ${computed.overflowY}`,
      );
      if (
        !fixed &&
        !modal &&
        !scrollable &&
        !node.scrollLeft &&
        !node.scrollTop
      )
        return [];
      const previous = node.getAttribute(markerName);
      const id = String(index);
      node.setAttribute(markerName, id);
      const rect = node.getBoundingClientRect();
      const backdrop = modal ? getComputedStyle(node, "::backdrop") : null;
      return [
        {
          node,
          id,
          previous,
          fixed,
          modal,
          scrollable,
          rect,
          x: node.scrollLeft,
          y: node.scrollTop,
          backdropColor: backdrop?.backgroundColor,
          backdropFilter: backdrop?.backdropFilter,
        },
      ];
    });
  const paused = document.getAnimations().flatMap((animation) => {
    if (animation.playState !== "running" && !animation.pending) return [];
    animation.pause();
    return [animation];
  });
  const svgMarkerName = "data-feedback-capture-svg";
  const svgStyles: Array<{
    node: SVGElement;
    id: string;
    previous: string | null;
    properties: Array<[string, string]>;
  }> = [];

  try {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    await document.fonts?.ready;

    // html-to-image deep-clones SVG subtrees without copying descendant styles.
    // Freeze their computed presentation too: otherwise CSS-only strokes lose
    // fill:none and become black filled shapes in the serialized image.
    for (const node of document.querySelectorAll<SVGElement>("body svg *")) {
      if (!(node instanceof SVGElement) || node.closest("[data-feedback-ui]"))
        continue;
      const computed = getComputedStyle(node);
      const id = String(svgStyles.length);
      svgStyles.push({
        node,
        id,
        previous: node.getAttribute(svgMarkerName),
        properties: Array.from(computed, (property) => [
          property,
          computed.getPropertyValue(property),
        ]),
      });
      node.setAttribute(svgMarkerName, id);
    }

    // This import stays out of the home-page bundle's startup path.
    const { toSvg } = await import("html-to-image");
    const imageErrors: string[] = [];
    const svgUrl = await toSvg(document.body, {
      width,
      height,
      pixelRatio: 1,
      backgroundColor:
        getComputedStyle(document.body).backgroundColor || "#171c20",
      cacheBust: true,
      style: {
        position: "relative",
        transform: `translate(${-scrollX}px, ${-scrollY}px)`,
        transformOrigin: "top left",
        height: `${document.body.scrollHeight}px`,
        margin: "0",
        overflow: "visible",
      },
      filter: (node) => {
        // html-to-image also visits text nodes at runtime despite its public type.
        return (
          !(node instanceof Element) || !node.closest("[data-feedback-ui]")
        );
      },
      onImageErrorHandler: (error) => imageErrors.push(String(error)),
    });

    if (imageErrors.length)
      throw new Error("页面中的图片无法完整读取，请稍后重试或改用文字反馈。");
    // A DOM clone has neither native scrolling offsets nor the browser's dialog
    // top layer. Restore those in the serialized copy, never in the live page.
    const svgText = decodeURIComponent(svgUrl.slice(svgUrl.indexOf(",") + 1));
    const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const clonedBody = parsed.querySelector("body");
    if (!clonedBody || parsed.querySelector("parsererror"))
      throw new Error("无法读取页面截图。");
    for (const entry of svgStyles) {
      const clone = parsed.querySelector<SVGElement>(
        `[${svgMarkerName}="${entry.id}"]`,
      );
      if (!clone) continue;
      clone.removeAttribute(svgMarkerName);
      for (const [property, value] of entry.properties)
        clone.style.setProperty(property, value);
    }
    const records = layout.map((entry) => ({
      ...entry,
      clone: parsed.querySelector<HTMLElement>(`[${markerName}="${entry.id}"]`),
    }));
    for (const entry of records) {
      const clone = entry.clone;
      if (!clone) continue;
      clone.removeAttribute(markerName);
      // SVG foreignObject may render classic scrollbars even when the browser
      // uses hidden overlay scrollbars. Clip the frozen, offset content instead.
      if (entry.scrollable) clone.style.overflow = "hidden";
      if (entry.x || entry.y) {
        for (const child of [...clone.children]) {
          const element = child as HTMLElement;
          const oldTransform = element.style.transform;
          element.style.transform = `translate(${-entry.x}px, ${-entry.y}px) ${oldTransform === "none" ? "" : oldTransform}`;
        }
      }
      if (entry.fixed || entry.modal) {
        Object.assign(clone.style, {
          position: "absolute",
          inset: "auto",
          margin: "0",
          left: `${entry.rect.left + scrollX}px`,
          top: `${entry.rect.top + scrollY}px`,
          width: `${entry.rect.width}px`,
          height: `${entry.rect.height}px`,
          maxWidth: "none",
          maxHeight: "none",
          boxSizing: "border-box",
          transform: "none",
          translate: "none",
        });
        clonedBody.appendChild(clone);
      }
    }
    let backdropFilter = "";
    for (const [index, entry] of records
      .filter((entry) => entry.modal)
      .entries()) {
      if (!entry.clone) continue;
      const backdrop = parsed.createElementNS(
        "http://www.w3.org/1999/xhtml",
        "div",
      );
      Object.assign(backdrop.style, {
        position: "absolute",
        left: `${scrollX}px`,
        top: `${scrollY}px`,
        width: `${width}px`,
        height: `${height}px`,
        background: entry.backdropColor || "#0009",
        zIndex: String(2_000_000_000 + index * 2),
      });
      entry.clone.style.zIndex = String(2_000_000_001 + index * 2);
      clonedBody.insertBefore(backdrop, entry.clone);
      if (entry.backdropFilter && entry.backdropFilter !== "none")
        backdropFilter = entry.backdropFilter;
    }
    if (backdropFilter) {
      const root = parsed.getElementById("root") as HTMLElement | null;
      if (root) root.style.filter = backdropFilter;
    }
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(parsed.documentElement))}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法创建页面截图。");
    context.fillStyle = "#171c20";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvasToBoundedDataUrl(canvas);
  } finally {
    for (const entry of svgStyles) {
      if (entry.previous === null) entry.node.removeAttribute(svgMarkerName);
      else entry.node.setAttribute(svgMarkerName, entry.previous);
    }
    for (const entry of layout) {
      if (entry.previous === null) entry.node.removeAttribute(markerName);
      else entry.node.setAttribute(markerName, entry.previous);
    }
    paused.forEach((animation) => {
      if (animation.playState === "paused") animation.play();
    });
  }
}

export async function cropSnapshot(
  snapshot: ViewportSnapshot,
  crop: CropBounds,
): Promise<ViewportSnapshot> {
  const image = new Image();
  image.decoding = "async";
  image.src = snapshot.dataUrl;
  await image.decode();

  const x = Math.max(0, Math.floor(crop.x));
  const y = Math.max(0, Math.floor(crop.y));
  const width = Math.max(
    1,
    Math.min(snapshot.width - x, Math.ceil(crop.width)),
  );
  const height = Math.max(
    1,
    Math.min(snapshot.height - y, Math.ceil(crop.height)),
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法裁剪截图，请继续使用文字反馈。");
  context.drawImage(image, x, y, width, height, 0, 0, width, height);
  return canvasToBoundedDataUrl(canvas);
}

export async function annotateSnapshot(
  snapshot: ViewportSnapshot,
  ellipses: Array<{ cx: number; cy: number; rx: number; ry: number }>,
): Promise<ViewportSnapshot> {
  const image = new Image();
  image.decoding = "async";
  image.src = snapshot.dataUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = snapshot.width;
  canvas.height = snapshot.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法处理截图，请继续使用文字反馈。");
  context.drawImage(image, 0, 0, snapshot.width, snapshot.height);
  if (ellipses.length) {
    context.lineJoin = "round";
    context.lineCap = "round";
    for (const ellipse of ellipses) {
      context.beginPath();
      context.ellipse(
        ellipse.cx,
        ellipse.cy,
        Math.max(5, ellipse.rx),
        Math.max(5, ellipse.ry),
        0,
        0,
        Math.PI * 2,
      );
      context.strokeStyle = "#101716";
      context.lineWidth = Math.max(
        6,
        Math.min(snapshot.width, snapshot.height) * 0.012,
      );
      context.stroke();
      context.strokeStyle = "#d4e3c7";
      context.lineWidth = Math.max(
        3,
        Math.min(snapshot.width, snapshot.height) * 0.006,
      );
      context.stroke();
    }
  }
  return canvasToBoundedDataUrl(canvas);
}
