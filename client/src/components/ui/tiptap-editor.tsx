import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import ListItem from '@tiptap/extension-list-item'
import { cn } from "@/lib/utils"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Quote,
  XCircle,
  Undo,
  Redo,
  Pilcrow,
  Heading1,
  Heading2,
  Minus,
  RotateCcw
} from 'lucide-react'

export interface TiptapEditorProps {
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 p-1 border-b bg-muted/50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50",
          editor.isActive('bold') && "bg-muted"
        )}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50",
          editor.isActive('italic') && "bg-muted"
        )}
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50",
          editor.isActive('code') && "bg-muted"
        )}
      >
        <Code className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted"
      >
        <XCircle className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().clearNodes().run()}
        className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted",
          editor.isActive('paragraph') && "bg-muted"
        )}
      >
        <Pilcrow className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted",
          editor.isActive('heading', { level: 1 }) && "bg-muted"
        )}
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted",
          editor.isActive('heading', { level: 2 }) && "bg-muted"
        )}
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted",
          editor.isActive('bulletList') && "bg-muted"
        )}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted",
          editor.isActive('orderedList') && "bg-muted"
        )}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted",
          editor.isActive('blockquote') && "bg-muted"
        )}
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-muted disabled:opacity-50"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  )
}

export function TiptapEditor({
  value,
  onChange,
  disabled,
  placeholder,
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      TextStyle.configure({ types: [ListItem.name] }),
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-3 py-2',
          disabled && 'cursor-not-allowed opacity-60',
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <MenuBar editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
        {editor.isEmpty && placeholder && (
          <div className="absolute top-[calc(0.75rem)] left-[calc(0.75rem)] text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}