import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from "@/lib/utils"

export interface TiptapEditorProps {
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
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
      StarterKit,
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  return <EditorContent editor={editor} />
}
