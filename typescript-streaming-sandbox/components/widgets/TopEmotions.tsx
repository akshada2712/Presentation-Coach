import { Emotion } from "../../lib/data/emotion";

const EmotionColorMap = new Map<string, string>([
  ["Admiration", "bg-emerald-800"],
  ["Adoration", "bg-emerald-800"],
  ["Aesthetic Appreciation", "bg-emerald-800"],
  ["Amusement", "bg-emerald-800"],
  ["Anger", "bg-red-800"],
  ["Anxiety", "bg-red-800"],
  ["Awe", "bg-emerald-800"],
  ["Awkwardness", "bg-red-800"],
  ["Boredom", "bg-red-800"],
  ["Calmness", "bg-emerald-800"],
  ["Concentration", "bg-emerald-800"],
  ["Confusion", "bg-red-800"],
  ["Contemplation", "bg-red-800"],
  ["Contempt", "bg-emerald-800"],
  ["Contentment", "bg-emerald-800"],
  ["Craving", "bg-emerald-800"],
  ["Desire", "bg-emerald-800"],
  ["Determination", "bg-emerald-800"],
  ["Disappointment", "bg-red-800"],
  ["Disgust", "bg-red-800"],
  ["Distress", "bg-red-800"],
  ["Doubt", "bg-red-800"],
  ["Ecstasy", "bg-emerald-800"],
  ["Embarrassment", "bg-red-800"],
  ["Empathic Pain", "bg-emerald-800"],
  ["Entrancement", "bg-emerald-800"],
  ["Envy", "bg-red-800"],
  ["Excitement", "bg-emerald-800"],
  ["Fear", "bg-red-800"],
  ["Guilt", "bg-red-800"],
  ["Horror", "bg-red-800"],
  ["Interest", "bg-emerald-800"],
  ["Joy", "bg-emerald-800"],
  ["Love", "bg-emerald-800"],
  ["Nostalgia", "bg-emerald-800"],
  ["Pain", "bg-emerald-800"],
  ["Pride", "bg-emerald-800"],
  ["Realization", "bg-emerald-800"],
  ["Relief", "bg-emerald-800"],
  ["Romance", "bg-emerald-800"],
  ["Sadness", "bg-emerald-800"],
  ["Satisfaction", "bg-emerald-800"],
  ["Shame", "bg-red-800"],
  ["Surprise (negative)", "bg-red-800"],
  ["Surprise (positive)", "bg-emerald-800"],
  ["Sympathy", "bg-emerald-800"],
  ["Tiredness", "bg-red-800"],
  ["Triumph", "bg-emerald-800"],
]);

type TopEmotionsProps = {
  className?: string;
  emotions: Emotion[];
  numEmotions: number;
};

export function TopEmotions({ className, emotions, numEmotions }: TopEmotionsProps) {
  className = className || "";

  return (
    <div className={`${className}`}>
      {emotions
        .sort((a: Emotion, b: Emotion) => b.score - a.score)
        .slice(0, numEmotions)
        .map((emotion, i) => (
          <div key={i} className="mb-3 flex rounded-full border border-neutral-200 text-sm shadow">
            <div className="flex w-10 justify-center rounded-l-full bg-white py-2 pl-5 pr-4 font-medium text-neutral-800">
              <span>{i + 1}</span>
            </div>
            <div className={`w-48 ${EmotionColorMap.get(emotion.name)} px-4 py-2 lowercase text-white`}>
              <span>{emotion.name}</span>
            </div>
            <div className="flex w-20 justify-center rounded-r-full bg-white py-2 pr-4 pl-3 font-medium text-neutral-800">
              <span>{emotion.score.toFixed(3)}</span>
            </div>
          </div>
        ))}
    </div>
  );
}

TopEmotions.defaultProps = {
  numEmotions: 3,
};
