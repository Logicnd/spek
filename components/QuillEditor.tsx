"use client";

import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import TurndownService from "turndown";

interface QuillEditorProps {
  initialHtml: string;
  onChange: (markdown: string, html: string) => void;
}

export const QuillEditor: React.FC<QuillEditorProps> = ({ initialHtml, onChange }) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<Quill | null>(null);
  const isInternalUpdateRef = useRef(false);

  const turndownService = React.useMemo(() => {
    const td = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
    return td;
  }, []);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    // Initialize Quill instance
    const quill = new Quill(editorContainerRef.current, {
      theme: "snow",
      placeholder: "Write rich technical documentation, import tables, or paste Confluence content...",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          ["code", "code-block", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "clean"],
        ],
      },
    });

    quillInstanceRef.current = quill;

    // Load initial HTML content
    if (initialHtml) {
      isInternalUpdateRef.current = true;
      quill.clipboard.dangerouslyPasteHTML(initialHtml);
      isInternalUpdateRef.current = false;
    }

    // Handle text-change events
    quill.on("text-change", (delta, oldDelta, source) => {
      if (source === "user") {
        const currentHtml = quill.getSemanticHTML?.() || quill.root.innerHTML;
        const convertedMarkdown = turndownService.turndown(currentHtml);
        onChange(convertedMarkdown, currentHtml);
      }
    });

    return () => {
      quillInstanceRef.current = null;
      if (editorContainerRef.current) {
        editorContainerRef.current.innerHTML = "";
      }
    };
  }, []);

  // Update content when initialHtml changes externally
  useEffect(() => {
    const quill = quillInstanceRef.current;
    if (!quill || isInternalUpdateRef.current) return;

    const currentHtml = quill.getSemanticHTML?.() || quill.root.innerHTML;
    if (initialHtml !== currentHtml) {
      isInternalUpdateRef.current = true;
      quill.clipboard.dangerouslyPasteHTML(initialHtml);
      isInternalUpdateRef.current = false;
    }
  }, [initialHtml]);

  return (
    <div className="flex flex-col h-full bg-spek-panel border border-spek-border overflow-hidden">
      <div className="spek-quill-wrapper flex-1 overflow-auto flex flex-col">
        <div ref={editorContainerRef} className="flex-1 font-sans text-spek-text" />
      </div>
    </div>
  );
};

