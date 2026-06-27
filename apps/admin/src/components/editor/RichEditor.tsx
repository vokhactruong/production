import React, { useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { cn } from "../../utils";
import { uploadApi, getData } from "../../api/client";
import { useToast } from "../Toast";
import type { UploadResponse } from "../../types";

interface RichEditorProps {
  value?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
        active ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-100"
      )}
    >
      {children}
    </button>
  );
}

export default function RichEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  disabled,
}: RichEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { emitToast } = useToast();
  const isInitialized = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editable: !disabled,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  useEffect(() => {
    if (editor && value && !isInitialized.current) {
      editor.commands.setContent(value);
      isInitialized.current = true;
    }
  }, [editor, value]);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadApi.image(file);
      const { url } = getData<UploadResponse>(res);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      emitToast("Upload ảnh thất bại", "error");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const setLink = () => {
    const url = window.prompt("Nhập URL:");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b border-slate-200 bg-slate-50 p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </ToolbarButton>
        <div className="mx-1 h-8 w-px bg-slate-200" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>
        <div className="mx-1 h-8 w-px bg-slate-200" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          •—
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          "
        </ToolbarButton>
        <div className="mx-1 h-8 w-px bg-slate-200" />
        <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
          🔗
        </ToolbarButton>
        <ToolbarButton onClick={() => fileRef.current?.click()} title="Image" active={false}>
          🖼
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
          active={false}
        >
          —
        </ToolbarButton>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Content */}
      <EditorContent
        editor={editor}
        className="prose prose-slate max-w-none p-4 min-h-[280px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[240px]"
      />
    </div>
  );
}
