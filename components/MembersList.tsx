"use client";

import { User } from "@/lib/types";
import Image from "next/image";

interface MembersListProps {
  members: User[];
  onAvatarClick?: (user: User) => void;
}

function getAvatarDisplay(avatar: string | undefined, username: string) {
  if (!avatar) {
    return { type: "text", content: username.charAt(0).toUpperCase() };
  }
  
  if (avatar.startsWith("http") || avatar.startsWith("data:")) {
    return { type: "image", content: avatar };
  }
  
  return { type: "emoji", content: avatar };
}

export default function MembersList({ members, onAvatarClick }: MembersListProps) {
  return (
    <div className="w-60 bg-slate-800 flex flex-col h-full border-l border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 uppercase">
          Members — {members.length}
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {members.map((member) => {
          const avatar = getAvatarDisplay(member.avatar, member.username);
          
          return (
            <button
              key={member.id}
              onClick={() => onAvatarClick?.(member)}
              className="w-full flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 text-lg overflow-hidden">
                {avatar.type === "image" ? (
                  <Image
                    src={avatar.content}
                    alt={member.username}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  avatar.content
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
                  {member.displayName || member.username}
                </div>
                {member.status && (
                  <div className="text-xs text-slate-400 truncate">
                    {member.status}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
