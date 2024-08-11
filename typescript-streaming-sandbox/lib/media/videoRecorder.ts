import { canvasToImageBlob } from "../utilities/blobUtilities";

type Size = {
  width: number;
  height: number;
};

export class VideoRecorder {
  private videoElement: HTMLVideoElement;
  private photoElement: HTMLCanvasElement;
  private imageSize: Size;
  private mediaStream: MediaStream;
  private mediaRecorder: MediaRecorder;
  private recordedChunks: Blob[];

  private constructor(
    videoElement: HTMLVideoElement,
    photoElement: HTMLCanvasElement,
    imageSize: Size,
    mediaStream: MediaStream,
    mediaRecorder: MediaRecorder,
    recordedChunks: Blob[],
  ) {
    this.videoElement = videoElement;
    this.photoElement = photoElement;

    this.imageSize = imageSize;
    this.mediaStream = mediaStream;
  }

  static async create(videoElement: HTMLVideoElement, photoElement: HTMLCanvasElement) {
    const mediaOptions = { audio: true, video: true };
    const mediaStream = await navigator.mediaDevices.getUserMedia(mediaOptions);
    const mediaRecorder = new MediaRecorder(mediaStream);
    const recordedChunks = <Blob[]>[];
    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      console.log("video-chunk-available");
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log(recordedChunks);
        VideoRecorder.downloadVideo(recordedChunks);
      } else {
        // …
    }
    };
    // TODO(chairuni): only start recording when the user clicks "start"
    mediaRecorder.start();

    videoElement.srcObject = mediaStream;
    videoElement.play();

    const imageSize = await VideoRecorder.setVideoSize(videoElement, photoElement);
    return new VideoRecorder(videoElement, photoElement, imageSize, mediaStream, mediaRecorder, recordedChunks);
  }

  // TODO(chairuni): call stopRecording when the user clicks "stop"
  async stopRecording() {
    this.mediaStream.getTracks().forEach((track) => {
      // TODO(chairuni): download the video!
      track.stop();
    });
  }

  // private handleVideoChunkAvailable(event: BlobEvent) {
  //   console.log("video-chunk-available");
  //   if (event.data.size > 0) {
  //     this.recordedChunks.push(event.data);
  //     console.log(this.recordedChunks);
  //   } else {
  //     // …
  //   }
  // }

  private static downloadVideo(recordedChunks: Blob[]) {
    const blob = new Blob(recordedChunks, {
      type: "video/webm",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "test.webm";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private static setVideoSize(videoElement: HTMLVideoElement, photoElement: HTMLCanvasElement) {
    return new Promise((resolve: (size: Size) => void, _) => {
      videoElement.addEventListener(
        "canplay",
        () => {
          const videoWidth = 500;
          const videoHeight = (videoElement.videoHeight * videoWidth) / videoElement.videoWidth;

          videoElement.setAttribute("width", videoWidth.toString());
          videoElement.setAttribute("height", videoHeight.toString());
          photoElement.setAttribute("width", videoWidth.toString());
          photoElement.setAttribute("height", videoHeight.toString());

          resolve({ width: videoWidth, height: videoHeight });
        },
        false
      );
    });
  }

  async takePhoto(format: string = "image/png"): Promise<Blob> {
    const context = this.photoElement.getContext("2d");
    if (!context) {
      console.log("Could not get photo context");
      throw Error("Could not get graphics context from canvas");
    }

    this.photoElement.width = this.imageSize.width;
    this.photoElement.height = this.imageSize.height;
    context.translate(this.imageSize.width, 0);
    context.scale(-1, 1);
    context.drawImage(this.videoElement, 0, 0, this.imageSize.width, this.imageSize.height);

    return await canvasToImageBlob(this.photoElement, format);
  }
}
