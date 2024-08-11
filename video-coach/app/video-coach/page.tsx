import VideoCoach from "./VideoCoach";

export default function Page() {
  return <VideoCoach
  NEXT_PUBLIC_GROQ_API_KEY={process.env.NEXT_PUBLIC_GROQ_API_KEY!}
  NEXT_PUBLIC_HUME_API_KEY={process.env.NEXT_PUBLIC_HUME_API_KEY!}
 />;
}
