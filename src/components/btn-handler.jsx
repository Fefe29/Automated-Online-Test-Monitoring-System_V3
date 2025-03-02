import { useState, useRef } from "react";
import { Webcam } from "../utils/webcam";

const ButtonHandler = ({ imageRef, cameraRef, videoRef, toggleSession, sessionActive }) => {
  const [streaming, setStreaming] = useState(null); // streaming state
  const inputImageRef = useRef(null); // video input reference
  const inputVideoRef = useRef(null); // video input reference
  const webcam = new Webcam(); // webcam handler

  // closing image
  const closeImage = () => {
    const url = imageRef.current.src;
    imageRef.current.src = "#"; // restore image source
    URL.revokeObjectURL(url); // revoke url

    setStreaming(null); // set streaming to null
    inputImageRef.current.value = ""; // reset input image
    imageRef.current.style.display = "none"; // hide image
  };

  // closing video streaming
  const closeVideo = () => {
    const url = videoRef.current.src;
    videoRef.current.src = ""; // restore video source
    URL.revokeObjectURL(url); // revoke url

    setStreaming(null); // set streaming to null
    inputVideoRef.current.value = ""; // reset input video
    videoRef.current.style.display = "none"; // hide video
  };

  // opening front-facing camera
  const openFrontCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // Use "user" to specify the front camera
        audio: false,
      });
      cameraRef.current.srcObject = stream; // Attach the stream to the camera element
      cameraRef.current.style.display = "block"; // Show the camera
      setStreaming("frontCamera"); // Update the streaming state
      toggleSession(); // Start session logging
    } catch (error) {
      alert("Error accessing front camera: " + error.message);
    }
  };

  // closing front-facing camera
  const closeFrontCamera = () => {
    const tracks = cameraRef.current.srcObject?.getTracks();
    tracks?.forEach((track) => track.stop()); // Stop all tracks
    cameraRef.current.srcObject = null; // Remove the video source
    cameraRef.current.style.display = "none"; // Hide the camera
    setStreaming(null); // Reset streaming state
    toggleSession(); // Stop session logging and calculate summary
  };

  return (
    <div className="btn-container">
      {/* Front Camera Handler */}
      <button
        onClick={() => {
          if (streaming === null || streaming !== "frontCamera") {
            if (streaming === "camera") webcam.close(cameraRef.current);
            openFrontCamera(); // Open front-facing camera
          } else {
            closeFrontCamera(); // Close front-facing camera
          }
        }}
      >
        {streaming === "frontCamera" ? "Close The Session" : "Start The Session"}
      </button>
    </div>
  );
};

export default ButtonHandler;
