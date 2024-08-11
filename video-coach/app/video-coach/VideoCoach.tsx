"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { upload } from "@vercel/blob/client";
import {
  UserCircleIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HumeClient } from "hume";

import ReactMarkdown from "react-markdown";
import {
  EmotionScore,
  InferencePrediction,
  UnionPredictResult,
} from "hume/api/resources/expressionMeasurement";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { PutBlobResult } from "@vercel/blob";

type EmotionPrediction = {
  time: { start: number; end: number };
  text: string;
  top_prosody_emotions: { name: string; score: number }[];
  top_facial_emotions: { name: string; score: number }[];
};

// Define the type for the coaching data
type CoachingSegment = EmotionPrediction & {
  effectiveness_score: number;
  coaching_feedback: string;
};

export default function VideoCoach({
  NEXT_PUBLIC_GROQ_API_KEY,
  NEXT_PUBLIC_HUME_API_KEY,
}: {
  NEXT_PUBLIC_GROQ_API_KEY: string;
  NEXT_PUBLIC_HUME_API_KEY: string;
}) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [coachingData, setCoachingData] = useState<CoachingSegment[]>([]);
  const [currentCoachingSegment, setCurrentCoachingSegment] =
    useState<CoachingSegment | null>(null);
  const [inferenceStatus, setInferenceStatus] = useState<string>("");
  const [subStatus, setSubStatus] = useState<string>("");
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (videoRef.current && timelineRef.current) {
        const videoRect = videoRef.current.getBoundingClientRect();
        timelineRef.current.style.width = `${videoRect.width}px`;
      }
    });

    if (videoRef.current) {
      resizeObserver.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        resizeObserver.unobserve(videoRef.current);
      }
    };
  }, []);

  function getTopEmotions(
    emotions: EmotionScore[],
    topN: number = 3
  ): EmotionScore[] {
    return emotions.sort((a, b) => b.score - a.score).slice(0, topN);
  }
  const reformatEmotionsData = useCallback(
    (data: UnionPredictResult[]): EmotionPrediction[] => {
      const results = Array<EmotionPrediction>();

      const predictions = data[0].results!
        .predictions[0] as InferencePrediction;
      const facePredictions =
        predictions.models!.face!.groupedPredictions[0].predictions;
      const prosodyPredictions =
        predictions.models!.prosody!.groupedPredictions[0].predictions;

      for (const prosody of prosodyPredictions) {
        const startTime = prosody.time.begin;
        const endTime = prosody.time.end;
        const text = prosody.text ?? "";

        // Get top prosody emotions
        const topProsodyEmotions = getTopEmotions(prosody.emotions);

        // Find corresponding facial emotion
        const matchingFace = facePredictions.find(
          (face) => face.time >= startTime && face.time < endTime
        );

        let topFacialEmotions: EmotionScore[] = [];
        if (matchingFace) {
          topFacialEmotions = getTopEmotions(matchingFace.emotions);
        }

        results.push({
          time: { start: startTime, end: endTime },
          text,
          top_prosody_emotions: topProsodyEmotions,
          top_facial_emotions: topFacialEmotions,
        });
      }

      return results;
    },
    []
  );

  const getAdvice = useCallback(
    async (emotionPredictions: EmotionPrediction, transcript: string) => {
      const model = new ChatGroq({
        apiKey: NEXT_PUBLIC_GROQ_API_KEY,
        model: "llama3-70b-8192",
      });
      const schema = z.object({
        score: z
          .number()
          .describe(
            "a number between 1 and 10. 10 being perfect and 1 major improvements can be made."
          ),
        coaching_feedback: z
          .string()
          .describe(
            "a markdown formatted string that contains the feedback for content, speed, and the effectiveness of the emotions."
          ),
      });
      const structuredModel = model.withStructuredOutput(schema, {
        name: "feedback",
      });
      const prompt = ChatPromptTemplate.fromTemplate(
        [
          "You are a presentation coach, and you are coaching a rising executive on their presentation skills.",
          "You are excellent in giving feedback on how the presenter's emotions and their contents work together",
          "to craft moving presentations.\n",
          "You are given the presentation's entire transcript as context, and you are giving feedback to presenter",
          "for one sentence at a time.",
          "You will be given the sentence presented as well as the facial and speech emotions of the presenter",
          "while presenting that sentence.",
          "You will give feedback in the following categories: content, speed, and effectiveness of the emotions.",
          "You will output the feedback in a json object with two fields: `score` and `coaching_feedback`.\n\n",
          " * `score` is a number between 1 and 10. 10 being perfect and 1 major improvements can be made.\n",
          " * `coaching_feedback` is a markdown formatted string that contains the feedback for content, speed,",
          "and the effectiveness of the emotions.\n\n",
          "Do not output any other information.\n\n",
          "<Transcript>{transcript}</Transcript>",
          "<Sentence>{sentence}</Sentence>",
          "<TopSpeechEmotions>{topSpeechEmotions}</TopSpeechEmotions>",
          "<TopFacialEmotions>{topFacialEmotions}</TopFacialEmotions>\n\n",
          "Your output (in JSON format):\n",
        ].join(" ")
      );

      const chain = prompt.pipe(structuredModel);
      const result = await chain.invoke({
        transcript,
        sentence: emotionPredictions.text,
        topSpeechEmotions: emotionPredictions.top_prosody_emotions
          .map(
            (emotion) =>
              `${emotion.name} (${(emotion.score * 100).toFixed(1)}%)`
          )
          .join(", "),
        topFacialEmotions: emotionPredictions.top_facial_emotions
          .map(
            (emotion) =>
              `${emotion.name} (${(emotion.score * 100).toFixed(1)}%)`
          )
          .join(", "),
      });
      return result;
    },
    [NEXT_PUBLIC_GROQ_API_KEY]
  );

  useEffect(() => {
    async function startInferenceJob() {
      if (blob) {
        try {
          setInferenceStatus("Starting inference job");
          setSubStatus("Initializing Hume client");
          const client = new HumeClient({ apiKey: NEXT_PUBLIC_HUME_API_KEY });

          setSubStatus("Starting job");
          const job =
            await client.expressionMeasurement.batch.startInferenceJob({
              models: {
                face: { fpsPred: 3 },
                prosody: { granularity: "sentence" },
              },
              urls: [blob.url],
            });

          setSubStatus("Waiting for job completion");
          await job.awaitCompletion();

          setSubStatus("Fetching predictions");
          const predictions =
            await client.expressionMeasurement.batch.getJobPredictions(
              job.jobId
            );

          setSubStatus("Reformatting predictions");
          const reformattedPredictions = reformatEmotionsData(predictions);
          const transcript = reformattedPredictions
            .map((segment) => segment.text)
            .join(" ");

          setSubStatus("Generating coaching advice");
          const newCoachingData: CoachingSegment[] = await Promise.all(
            reformattedPredictions.map(async (segment, index) => {
              setSubStatus(
                `Generating advice for segment ${index + 1}/${
                  reformattedPredictions.length
                }`
              );
              const advice = await getAdvice(segment, transcript);
              return {
                ...segment,
                effectiveness_score: advice?.score || 10,
                coaching_feedback: advice?.coaching_feedback || "",
              };
            })
          );

          setCoachingData(newCoachingData);
          setInferenceStatus("Completed");
          setSubStatus("");
        } catch (error) {
          console.error("Error in inference job:", error);
          setInferenceStatus("Error");
          setSubStatus(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
        }
      } else {
        setCoachingData([]);
        setInferenceStatus("");
        setSubStatus("");
      }
    }
    startInferenceJob();
  }, [
    NEXT_PUBLIC_HUME_API_KEY,
    blob,
    getAdvice,
    reformatEmotionsData,
  ]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (inputFileRef.current) {
      inputFileRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    const newBlob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: '/api/video-coach/upload',
    });
    setIsUploading(false);
    setBlob(newBlob);
  };

  useEffect(() => {
    const segment = coachingData.find(
      (seg) => currentTime >= seg.time.start && currentTime <= seg.time.end
    );
    setCurrentCoachingSegment(segment || null);
  }, [currentTime, coachingData]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const getSegmentColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };
  const EmotionBadge = ({
    emotion,
    score,
  }: {
    emotion: string;
    score: number;
  }) => (
    <div className="inline-flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
      <span>{emotion}</span>
      <span className="ml-1 text-xs font-normal">
        ({(score * 100).toFixed(1)}%)
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Video Coach</h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Upload your video to receive coaching
          </h2>

          {blob ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:space-x-4">
                <div className="lg:w-2/3">
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover rounded-lg"
                      controls
                      src={blob.url}
                      onTimeUpdate={handleTimeUpdate}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div
                    ref={timelineRef}
                    className="h-2 bg-gray-200 rounded-full overflow-hidden relative"
                  >
                    {coachingData.map((segment, index) => (
                      <div
                        key={index}
                        className={`h-full absolute ${getSegmentColor(
                          segment.effectiveness_score
                        )}`}
                        style={{
                          left: `${
                            (segment.time.start /
                              (videoRef.current?.duration || 1)) *
                            100
                          }%`,
                          width: `${
                            ((segment.time.end - segment.time.start) /
                              (videoRef.current?.duration || 1)) *
                            100
                          }%`,
                        }}
                      />
                    ))}
                  </div>
                  {inferenceStatus && (
                    <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">
                        Processing Status
                      </h3>
                      <p className="text-sm">{inferenceStatus}</p>
                      {subStatus && (
                        <p className="text-xs mt-1 text-gray-600">
                          {subStatus}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="lg:w-1/3 mt-4 lg:mt-0">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">
                      Coaching Advice
                    </h3>
                    {currentCoachingSegment && (
                      <>
                        <div className="mb-4">
                          <h4 className="font-semibold text-sm mb-2">
                            Coaching feedback:
                          </h4>
                          <div className="text-sm prose prose-sm">
                            <ReactMarkdown>
                              {currentCoachingSegment.coaching_feedback}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <div className="mb-4">
                          <h4 className="font-semibold text-sm mb-2">
                            Top Facial Emotions:
                          </h4>
                          <div>
                            {currentCoachingSegment.top_facial_emotions.map(
                              (emotion, index) => (
                                <EmotionBadge
                                  key={index}
                                  emotion={emotion.name}
                                  score={emotion.score}
                                />
                              )
                            )}
                          </div>
                        </div>
                        <div className="mb-4">
                          <h4 className="font-semibold text-sm mb-2">
                            Top Speech Emotions:
                          </h4>
                          <div>
                            {currentCoachingSegment.top_prosody_emotions.map(
                              (emotion, index) => (
                                <EmotionBadge
                                  key={index}
                                  emotion={emotion.name}
                                  score={emotion.score}
                                />
                              )
                            )}
                          </div>
                        </div>
                        <div className="mb-4">
                          <h4 className="font-semibold text-sm mb-2">
                            Transcript:
                          </h4>
                          <div className="text-sm prose prose-sm">
                            {currentCoachingSegment.text}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Video URL:{" "}
                <a
                  href={blob.url}
                  className="text-indigo-600 hover:text-indigo-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {blob.url}
                </a>
              </p>
              <button
                onClick={() => {
                  setBlob(null);
                  setSelectedFile(null);
                  setCoachingData([]);
                }}
                className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Upload Another Video
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (selectedFile) {
                  await uploadFile(selectedFile);
                }
              }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative"
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <DocumentIcon className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">
                          {selectedFile.name}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="mt-2 text-sm text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UserCircleIcon className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        MP4, MOV, or AVI (MAX. 800MB)
                      </p>
                    </div>
                  )}
                  <input
                    id="dropzone-file"
                    name="file"
                    ref={inputFileRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="video/mp4,video/quicktime,video/avi"
                  />
                </label>
              </div>
              {isUploading && (
                <div className="mt-4">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                          Uploading
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  selectedFile && !isUploading
                    ? "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {isUploading ? "Uploading..." : "Upload Video"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
