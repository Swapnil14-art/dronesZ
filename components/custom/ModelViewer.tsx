"use client";

import { useEffect, useRef, useState } from "react";
import {
  classifyFile,
  fileExtension,
  formatBytes,
  type PreviewKind,
} from "@/lib/model-formats";
import "./custom.css";

interface ModelViewerProps {
  file: File;
}

/**
 * Client-side preview of a locally-selected file, before any upload — nothing leaves the
 * browser here.
 * - mesh (STL/OBJ/PLY/glTF): rendered with online-3d-viewer, dynamically imported so its
 *   engine + three.js only load on this route and only once a mesh is actually chosen.
 * - image: object-URL <img>, revoked on cleanup.
 * - cad (STEP/STP): no in-browser preview (o3dv's STEP loader depends on a third-party CDN);
 *   we confirm receipt instead — the file still uploads and reaches the team.
 */
export function ModelViewer({ file }: ModelViewerProps) {
  const kind = classifyFile(file);

  return (
    <div className="model-viewer" data-kind={kind}>
      {kind === "mesh" && <MeshPreview file={file} />}
      {kind === "image" && <ImagePreview file={file} />}
      {kind === "cad" && <CadNotice file={file} />}
      {kind === "unsupported" && (
        <FilePlaceholder file={file} label="Preview unavailable" />
      )}
    </div>
  );
}

type MeshStatus = "loading" | "ready" | "error";

function MeshPreview({ file }: { file: File }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MeshStatus>("loading");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let viewer: { Destroy: () => void } | null = null;
    setStatus("loading");

    import("online-3d-viewer")
      .then((OV) => {
        if (cancelled || !mountRef.current) return;
        const embedded = new OV.EmbeddedViewer(mountRef.current, {
          backgroundColor: new OV.RGBAColor(12, 12, 14, 255),
          defaultColor: new OV.RGBColor(196, 198, 204),
          onModelLoaded: () => {
            if (!cancelled) setStatus("ready");
          },
          onModelLoadFailed: () => {
            if (!cancelled) setStatus("error");
          },
        });
        embedded.LoadModelFromFileList([file]);
        viewer = embedded;
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      viewer?.Destroy();
    };
  }, [file]);

  return (
    <div className="model-viewer__stage">
      <div ref={mountRef} className="model-viewer__canvas" aria-hidden="true" />
      {status !== "ready" && (
        <div className="model-viewer__overlay" role="status">
          {status === "loading"
            ? "Rendering preview…"
            : "Couldn’t render this file — it will still upload for our team to review."}
        </div>
      )}
      <p className="model-viewer__meta">
        {file.name} · {formatBytes(file.size)}
      </p>
    </div>
  );
}

function ImagePreview({ file }: { file: File }) {
  // Create and revoke the object URL inside one effect so they stay paired — creating it in
  // useMemo and revoking in a separate cleanup revokes the in-use URL under StrictMode/remount.
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

  return (
    <div className="model-viewer__stage">
      {/* Local object-URL preview; dimensions unknown until decode, so no explicit w/h. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="model-viewer__image"
        src={url}
        alt={`Preview of ${file.name}`}
      />
      <p className="model-viewer__meta">
        {file.name} · {formatBytes(file.size)}
      </p>
    </div>
  );
}

function CadNotice({ file }: { file: File }) {
  return (
    <FilePlaceholder
      file={file}
      label={`${fileExtension(file.name).toUpperCase()} file ready to send`}
      note="Live 3D preview isn’t available for CAD files here — our engineers will open it directly."
    />
  );
}

function FilePlaceholder({
  file,
  label,
  note,
}: {
  file: File;
  label: string;
  note?: string;
}) {
  return (
    <div className="model-viewer__placeholder">
      <span className="model-viewer__badge" aria-hidden="true">
        {fileExtension(file.name).toUpperCase() || "FILE"}
      </span>
      <p className="model-viewer__placeholder-label">{label}</p>
      <p className="model-viewer__meta">
        {file.name} · {formatBytes(file.size)}
      </p>
      {note && <p className="model-viewer__note">{note}</p>}
    </div>
  );
}
