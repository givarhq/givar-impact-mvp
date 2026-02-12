'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading2,
    Heading3,
    Undo,
    Redo,
} from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    label?: string;
    placeholder?: string;
    readOnly?: boolean;
}

const MenuButton = ({
    onClick,
    isActive,
    disabled,
    children,
    title
}: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
}) => (
    <button
        type="button"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
        }}
        disabled={disabled}
        title={title}
        className={cn(
            "p-2 rounded-3xl transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none",
            isActive
                ? "bg-primary text-white shadow-sm ring-1 ring-primary"
                : "text-muted-foreground hover:bg-muted"
        )}
    >
        {children}
    </button>
);

export function RichTextEditor({
    content,
    onChange,
    label,
    readOnly = false
}: RichTextEditorProps) {
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
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
        content: content,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
            forceUpdate();
        },
        onSelectionUpdate: () => {
            forceUpdate();
        },
        editorProps: {
            attributes: {
                class: cn(
                    "focus:outline-none min-h-[200px] p-4 text-sm leading-relaxed max-w-none",
                    "[&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:mt-4 [&_h2]:mb-2",
                    "[&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-foreground [&_h3]:text-lg [&_h3]:mt-3 [&_h3]:mb-1",
                    "[&_p]:text-foreground/80 [&_p]:my-2",
                    "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2",
                    "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2",
                    "[&_li]:my-1",
                    "[&_strong]:font-bold [&_strong]:text-foreground",
                    "[&_em]:italic",
                    readOnly ? "cursor-default" : "cursor-text"
                ),
            },
        },
        immediatelyRender: false,
    });

    // Sync content if it changes externally (e.g. initial load from API)
    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className="w-full space-y-1">
            {label && (
                <label className="text-xs font-bold text-muted-foreground/80 ml-1">
                    {label}
                </label>
            )}

            <div className={cn(
                "rounded-3xl border transition-all duration-200 overflow-hidden",
                readOnly
                    ? "bg-muted/10 border-transparent shadow-none"
                    : "bg-muted/20 border-border/40 focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/40 shadow-sm"
            )}>
                {!readOnly && (
                    <div className="flex flex-wrap items-center gap-1 p-1.5 border-b border-border/40 bg-muted/20">
                        <MenuButton
                            title="Bold"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive('bold')}
                        >
                            <Bold className="h-4 w-4" />
                        </MenuButton>
                        <MenuButton
                            title="Italic"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive('italic')}
                        >
                            <Italic className="h-4 w-4" />
                        </MenuButton>

                        <div className="w-px h-4 bg-border/40 mx-1" />

                        <MenuButton
                            title="Heading 2"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            isActive={editor.isActive('heading', { level: 2 })}
                        >
                            <Heading2 className="h-4 w-4" />
                        </MenuButton>
                        <MenuButton
                            title="Heading 3"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            isActive={editor.isActive('heading', { level: 3 })}
                        >
                            <Heading3 className="h-4 w-4" />
                        </MenuButton>

                        <div className="w-px h-4 bg-border/40 mx-1" />

                        <MenuButton
                            title="Bullet List"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                        >
                            <List className="h-4 w-4" />
                        </MenuButton>
                        <MenuButton
                            title="Numbered List"
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                        >
                            <ListOrdered className="h-4 w-4" />
                        </MenuButton>

                        <div className="flex-1 min-w-[20px]" />

                        <div className="flex items-center gap-1">
                            <MenuButton
                                title="Undo"
                                onClick={() => editor.chain().focus().undo().run()}
                                disabled={!editor.can().undo()}
                            >
                                <Undo className="h-4 w-4" />
                            </MenuButton>
                            <MenuButton
                                title="Redo"
                                onClick={() => editor.chain().focus().redo().run()}
                                disabled={!editor.can().redo()}
                            >
                                <Redo className="h-4 w-4" />
                            </MenuButton>
                        </div>
                    </div>
                )}
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}