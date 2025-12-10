import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, RotateCcw, Save, ArrowLeft } from "lucide-react";

interface CameraScanProps {
  onScanComplete: (scan: any) => void;
}

export default function CameraScan({ onScanComplete }: CameraScanProps) {
  const navigate = useNavigate();

  const API_KEY = "NeGo6JvVRY3BJZ2HUtYF";
  const MODEL_ID = "classification-waste/11";

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // -----------------------------
  // 1. Trigger camera or file input
  // -----------------------------
  const handleCapture = async () => {
    // Try native camera first on web
    if (cameraSupported && !isCameraActive) {
      await startCamera();
    } else {
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied or not available:", err);
      setCameraSupported(false);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  // Capture photo from video stream
  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      const imageUrl = canvasRef.current?.toDataURL("image/jpeg") || "";
      
      setCapturedImage(imageUrl);
      setIsCameraActive(false);
      stopCamera();
      await analyzeWithRoboflow(file, imageUrl);
    }, "image/jpeg", 0.95);
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // -----------------------------
  // 2. When an image is chosen
  // -----------------------------
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      setCapturedImage(imageUrl);

      await analyzeWithRoboflow(file, imageUrl);
    };
    reader.readAsDataURL(file);
  };

  // -----------------------------
  // 3. Send to Roboflow
  // -----------------------------
  async function analyzeWithRoboflow(file: File, previewUrl: string) {
    setIsAnalyzing(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(
        `https://classify.roboflow.com/${MODEL_ID}?api_key=${API_KEY}`,
        {
          method: "POST",
          body: form
        }
      );

      const json = await res.json();

      // Pull ONLY the predicted class (like your request)
      const predicted = json.predicted_classes?.[0] ?? "Unknown";

      setResult({
        image: previewUrl,
        category: predicted,
        confidence: Math.round(
          json.predictions[predicted]?.confidence * 100
        ),
        points: 10,
        type: predicted.toLowerCase()
      });
    } catch (err) {
      console.error(err);
      setResult(null);
    }

    setIsAnalyzing(false);
  }

  // -----------------------------
  // 4. Save scan
  // -----------------------------
  const handleSave = () => {
    if (result) {
      onScanComplete(result);
      navigate("/");
    }
  };

  // -----------------------------
  // 5. Rescan
  // -----------------------------
  const handleRescan = () => {
    setCapturedImage(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  const typeColor = (type: string) => {
    const colors: any = {
      plastic: "bg-blue-100 text-blue-600",
      glass: "bg-green-100 text-green-600",
      metal: "bg-gray-100 text-gray-600",
      paper: "bg-amber-100 text-amber-600",
      organic: "bg-lime-100 text-lime-600"
    };
    return colors[type] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="min-h-screen bg-black relative">
      {!capturedImage ? (
        <>
          {isCameraActive ? (
            // Camera view
            <>
              <div className="absolute top-0 left-0 right-0 z-10 p-6 flex items-center justify-between">
                <button
                  onClick={() => {
                    stopCamera();
                    setIsCameraActive(false);
                  }}
                  className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-white">Scan Item</h2>
                <div className="w-10"></div>
              </div>

              <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md aspect-square bg-gray-900 rounded-3xl mb-8 flex items-center justify-center border-4 border-dashed border-gray-700 overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex gap-6">
                  <button
                    onClick={captureFromCamera}
                    className="w-20 h-20 bg-[#34A853] rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </button>
                  
                  <button
                    onClick={() => {
                      stopCamera();
                      setIsCameraActive(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </>
          ) : (
            // Camera selection view
            <>
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 p-6 flex items-center justify-between">
                <button
                  onClick={() => navigate("/")}
                  className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-white">Scan Item</h2>
                <div className="w-10"></div>
              </div>

              {/* Camera placeholder */}
              <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md aspect-square bg-gray-900 rounded-3xl mb-8 flex items-center justify-center border-4 border-dashed border-gray-700 overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-6">
                  <button
                    onClick={handleCapture}
                    className="w-20 h-20 bg-[#34A853] rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </>
          )}
        </>
      ) : (
        <div className="min-h-screen bg-white">
          {/* Back button */}
          <div className="relative">
            <button
              onClick={handleRescan}
              className="absolute top-6 left-6 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-800" />
            </button>

            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-80 object-cover"
            />
          </div>

          <div className="p-6">
            {isAnalyzing ? (
              // ------------------------------------
              // ANALYZING UI
              // ------------------------------------
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
                <div className="w-16 h-16 border-4 border-[#34A853] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-gray-800 mb-2">Analyzing...</h2>
                <p className="text-gray-500">Identifying waste category</p>
              </div>
            ) : result ? (
              // ------------------------------------
              // RESULT UI
              // ------------------------------------
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✓</span>
                  </div>

                  <h2 className="text-gray-800 mb-2">
                    {result.category}
                  </h2>

                  <div
                    className={`inline-block px-4 py-2 rounded-full ${typeColor(
                      result.type
                    )}`}
                  >
                    {result.type.charAt(0).toUpperCase() +
                      result.type.slice(1)}
                  </div>
                </div>

                {/* Confidence + Points */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-gray-600">Confidence</span>
                    <span className="text-gray-800">
                      {result.confidence}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                    <span className="text-gray-600">Points Earned</span>
                    <span className="text-[#34A853]">
                      +{result.points}
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleRescan}
                    className="flex-1 border-2 border-gray-200 text-gray-700 rounded-full py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Rescan
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex-1 bg-[#34A853] text-white rounded-full py-3 flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    Save
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
