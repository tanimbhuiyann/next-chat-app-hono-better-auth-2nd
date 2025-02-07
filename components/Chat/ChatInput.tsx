import { Send, ImagePlus, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

type ChatInputProps = {
  newMessage: string
  setNewMessage: React.Dispatch<React.SetStateAction<string>>
  handleSendMessage: () => Promise<void>
  imageFile: File | null
  setImageFile: React.Dispatch<React.SetStateAction<File | null>>
  isUploading: boolean
  selectedFriend: { name: string; id: string; image?: string } | null
  fileInputRef: React.RefObject<HTMLInputElement>
}

export function ChatInput({
  newMessage,
  setNewMessage,
  handleSendMessage,
  imageFile,
  setImageFile,
  isUploading,
  selectedFriend,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSendMessage()
      }}
      className="p-4 border-t border-border flex gap-2"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
        className="hidden"
        id="file-input"
        disabled={isUploading}
      />
      <label
        htmlFor="file-input"
        className={`cursor-pointer p-2 rounded-lg ${isUploading ? "bg-muted cursor-not-allowed" : "hover:bg-accent"}`}
      >
        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
      </label>
      {imageFile && (
        <div className="flex items-center gap-2 bg-accent p-2 rounded-lg">
          <span className="text-sm truncate max-w-[100px]">{imageFile.name}</span>
          <button
            type="button"
            onClick={() => {
              setImageFile(null)
              if (fileInputRef.current) fileInputRef.current.value = ""
            }}
            className="text-red-500 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <Input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder={`Message ${selectedFriend?.name}...`}
        className="flex-1 border-t border-border rounded-full"
      />
      <Button type="submit" className="rounded-full">
        <Send size={20} />
      </Button>
    </form>
  )
}