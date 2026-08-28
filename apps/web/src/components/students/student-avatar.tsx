type StudentAvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
};

export function StudentAvatar({ name, photoUrl, size = "md" }: StudentAvatarProps) {
  return (
    <span className={`student-avatar student-avatar--${size}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={`${name} profil görseli`}
        height={size === "lg" ? 88 : size === "sm" ? 36 : 48}
        loading="lazy"
        src={photoUrl || "/images/avatars/default-boy.svg"}
        width={size === "lg" ? 88 : size === "sm" ? 36 : 48}
      />
    </span>
  );
}
