import { FaceWidgets } from "../../components/widgets/FaceWidgets";

export default function FacePage() {

  function stopEverything() {
    console.log("Hello world");
    const message = "Hello world";
    const iframe = document.querySelector("iframe");
    iframe?.contentWindow?.postMessage(message, "*");
  }

  function onStop(): void {
    stopEverything();
  }

  return (
    <div className="px-6 pt-10 pb-20 sm:px-10 md:px-14">
      <div className="flex flex-row flex-nowrap items-center gap-5 justify-center py-12">
        <div className="h-full p-6 text-center flex-1 flex-grow flex-direction: column-reverse"> 
          <iframe allow="microphone" style={{height: '800px',  width: '100%'}} src="http://localhost:5173/"></iframe>
        </div>
        <div className="h-full p-6 text-center flex-1 flex-grow">
          <div className="pb-6 text-2xl font-medium text-neutral-800">Facial Expression</div>
          <FaceWidgets onStop={onStop} />
        </div>
      </div>
    </div>
  );
}
