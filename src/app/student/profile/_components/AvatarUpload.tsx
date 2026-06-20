"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadAvatar } from "../actions";

interface Props {
  userId: string;
  avatarUrl: string | null;
  fullName: string;
}

export default function AvatarUpload({ userId: _userId, avatarUrl, fullName }: Props) {
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = (fullName || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    // Instant local preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    const result = await uploadAvatar(fd);

    setUploading(false);

    if (result.error) {
      toast.error("Upload failed: " + result.error);
      setPreview(avatarUrl);
    } else {
      setPreview(result.url!);
      toast.success("Profile picture updated!");
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative group focus:outline-none"
        aria-label="Change profile picture"
      >
        <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-[#1B3A8A] to-[#1D4ED8] flex items-center justify-center">
          {preview ? (
            <Image
              src={preview}
              alt={fullName || "Avatar"}
              width={96}
              height={96}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-3xl font-black text-white">{initials}</span>
          )}
        </div>

        <div className={`absolute inset-0 rounded-full flex flex-col items-center justify-center bg-black/50 transition-opacity ${uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <>
              <Camera className="h-5 w-5 text-white mb-1" />
              <span className="text-[10px] text-white font-semibold">Change</span>
            </>
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
