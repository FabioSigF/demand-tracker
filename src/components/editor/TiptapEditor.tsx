'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Link as LinkIcon,
} from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = 'Escreva a história ou detalhes da demanda...',
}: TiptapEditorProps) {

  const editor = useEditor({
    immediatelyRender: true,

    extensions: [
      StarterKit,

      Underline,

      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            'text-violet-500 hover:text-violet-600 underline cursor-pointer',
        },
      }),

      TaskList,

      TaskItem.configure({
        nested: true,
      }),

      Placeholder.configure({
        placeholder,
      }),
    ],

    content: value || '',

    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      if (html !== value) {
        onChange(html);
      }
    },

    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert max-w-none px-4 py-3 min-h-[220px] focus:outline-none text-sm text-foreground bg-muted/10 border border-border/80 border-t-0 rounded-b-xl',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();

    if (currentHtml === value) {
      return;
    }

    editor.commands.setContent(value || '', {
      emitUpdate: false,
    });
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;

    const url = window.prompt('URL do link:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .unsetLink()
        .run();

      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col rounded-xl border border-border overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-muted/30 border-b border-border select-none">

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition',
            editor.isActive('bold') &&
            'bg-primary/10 text-primary hover:bg-primary/15'
          )}
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition',
            editor.isActive('italic') &&
            'bg-primary/10 text-primary hover:bg-primary/15'
          )}
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(
            'p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition',
            editor.isActive('underline') &&
            'bg-primary/10 text-primary hover:bg-primary/15'
          )}
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border/60 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={setLink}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}