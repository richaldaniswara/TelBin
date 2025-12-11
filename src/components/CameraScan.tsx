import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, RotateCcw, Save, ArrowLeft, MapPin, Check } from "lucide-react";
import { db } from "../firebase"; 
import { addDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { doc } from "firebase/firestore";
import { collection, query, where, getDocs } from 'firebase/firestore';

interface CameraScanProps {
  onScanComplete: (scan: any) => void;
}

export default function CameraScan({ onScanComplete }: CameraScanProps) {
  const navigate = useNavigate();

  const API_KEY = "NeGo6JvVRY3BJZ2HUtYF";
  const MODEL_ID = "classification-waste/11";
  const TRASH_MODEL_ID = "trash-can-ze7w8/2";

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  
  // Location state
  const [location, setLocation] = useState<string>("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Proof of cleaning state
  const [proofOfCleaning, setProofOfCleaning] = useState<string | null>(null);
  const [isCapturingProof, setIsCapturingProof] = useState(false);
  const [proofAnalyzing, setProofAnalyzing] = useState(false);
  
  // Feedback messages
  const [scanFeedback, setScanFeedback] = useState<string>("");
  const [proofFeedback, setProofFeedback] = useState<string>("");
  
  // Date and time
  const [scanDateTime, setScanDateTime] = useState<Date>(new Date());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const proofVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proofCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const proofStreamRef = useRef<MediaStream | null>(null);

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
      setScanFeedback("✓ Item scanned successfully!");
      setTimeout(() => setScanFeedback(""), 3000);
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
      stopProofCamera();
    };
  }, []);

  // Update scan date/time on mount and when result changes
  useEffect(() => {
    setScanDateTime(new Date());
  }, [result]);

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation("Location access denied");
          setIsGettingLocation(false);
        }
      );
    } else {
      setLocation("Geolocation not supported");
      setIsGettingLocation(false);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  // =============================
  // PROOF OF CLEANING FUNCTIONS
  // =============================
  const handleCaptureProof = async () => {
    if (!isCapturingProof) {
      setIsCapturingProof(true);
      await startProofCamera();
    }
  };

  const startProofCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (proofVideoRef.current) {
        proofVideoRef.current.srcObject = stream;
        proofStreamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera for proof:", err);
      setIsCapturingProof(false);
      proofFileInputRef.current?.click();
    }
  };

  const captureProofFromCamera = async () => {
    if (!proofVideoRef.current || !proofCanvasRef.current) return;

    const context = proofCanvasRef.current.getContext("2d");
    if (!context) return;

    proofCanvasRef.current.width = proofVideoRef.current.videoWidth;
    proofCanvasRef.current.height = proofVideoRef.current.videoHeight;
    context.drawImage(proofVideoRef.current, 0, 0);

    proofCanvasRef.current.toBlob(async (blob: Blob | null) => {
      if (!blob) return;

      const imageUrl = proofCanvasRef.current?.toDataURL("image/jpeg") || "";
      const file = new File([blob], "proof-capture.jpg", { type: "image/jpeg" });
      
      setIsCapturingProof(false);
      stopProofCamera();
      await validateProofWithTrashDetection(file, imageUrl);
    }, "image/jpeg", 0.95);
  };

  const stopProofCamera = () => {
    if (proofStreamRef.current) {
      proofStreamRef.current.getTracks().forEach((track: any) => track.stop());
      proofStreamRef.current = null;
    }
    setIsCapturingProof(false);
  };

  const handleProofFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      await validateProofWithTrashDetection(file, imageUrl);
    };
    reader.readAsDataURL(file);
  };

async function validateProofWithTrashDetection(file: File, imageUrl: string) {
  setProofAnalyzing(true);

  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch(
      `https://detect.roboflow.com/${TRASH_MODEL_ID}?api_key=${API_KEY}`,
      {
        method: "POST",
        body: form
      }
    );

    const json = await res.json();

    // The model returns detections like:
    // json.predictions = [ { class, x, y, width, height, confidence }, ... ]
    const detections = json.predictions || [];

    // Check if AT LEAST ONE object was detected  
    // (the model only detects trash can classes)
    const hasTrashCan = detections.length > 0;

    if (hasTrashCan) {
      setProofOfCleaning(imageUrl);
      setProofFeedback("✓ Trash can detected — proof accepted!");
    } else {
      setProofFeedback("✗ No trash can found. Please try again.");
    }

  } catch (error) {
    console.error("Proof validation error:", error);
    setProofFeedback("✗ Error validating proof. Try again.");
  }

  setTimeout(() => setProofFeedback(""), 10000);
  setProofAnalyzing(false);
}

  // =============================
  // VALIDATION HELPERS
  // =============================
  const isDetectionValid = result && result.category !== "Unknown";
  const isLocationValid = location.trim().length > 0;
  const isProofValid = proofOfCleaning !== null;
  const canSave = isDetectionValid && isLocationValid && isProofValid;

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

  async function analyzeWithRoboflow(file: File, previewUrl: string) {
    setIsAnalyzing(true);

    const ALLOWED_CLASSES = [
      "biodegradable",
      "cardboard",
      "glass",
      "metal",
      "paper",
      "plastic"
    ];

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(
        `https://classify.roboflow.com/${MODEL_ID}?api_key=${API_KEY}`,
        { method: "POST", body: form }
      );

      const json = await res.json();
      const predictions = json.predictions || {};

      // Convert predictions to array
      const list = Object.entries(predictions).map(([label, data]: any) => ({
        class: label,
        confidence: (data.confidence || 0) * 100
      }));

      // Filter allowed classes
      const filtered = list
        .filter(p => ALLOWED_CLASSES.includes(p.class))
        .sort((a, b) => b.confidence - a.confidence);

      let finalResult = null;

      if (filtered.length > 0 && filtered[0].confidence >= 10) {
        finalResult = {
          image: previewUrl,
          category: filtered[0].class,
          confidence: Math.round(filtered[0].confidence),
          type: filtered[0].class.toLowerCase()
        };
        setScanFeedback("✓ Item scanned successfully!");
      } else {
        // Failed classification → mimic previous "Unknown Item"
        finalResult = {
          image: previewUrl,
          category: "Unknown",
          confidence: 0,
          type: "unknown"
        };
        setScanFeedback(""); // optional, or show "Please rescan"
      }

      setResult(finalResult);
    } catch (err) {
      console.error(err);
      setResult({
        image: previewUrl,
        category: "Unknown",
        confidence: 0,
        type: "unknown"
      });
      setScanFeedback("");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleSave = async () => {
    if (result && canSave) {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) return;
      try {
        const docRef = await addDoc(collection(db, "Submission"), {}); 
        
        const submissionData = {
          trashClass: result.category,
          location: location,
          timestampString: scanDateTime.toLocaleString(),
          proofUrl: proofOfCleaning,
          userId: user?.uid,
          submissionId: docRef.id,
          scannedTrash: capturedImage,
          timestampISO: scanDateTime.toISOString()
        };

        await setDoc(docRef, submissionData);

        console.log("Submission saved with ID:", docRef.id);

        const q = query(collection(db, "User"), where("email", "==", user.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const userData = userDoc.data();
          const currentPoints = userDoc.data().totalPoints || 0;
          const currentHistory = userData.history || [];
          await updateDoc(userDoc.ref, {
            totalPoints: currentPoints + 10,
            history: [...currentHistory, submissionData]
          });

          // Determine highest medal (if user has medals array)
          const highestMedal =
            userData.medals && userData.medals.length > 0
              ? userData.medals[userData.medals.length - 1] // last item = highest medal
              : null;

          // Save to Reports collection
          const reportData = {
            ...submissionData,
            userFullName: userData.fullName === "Update your name" ? userData.userId : userData.fullName || "Unknown",
            highestMedal: highestMedal || null,
          };

          await addDoc(collection(db, "Report"), reportData);
        }

        onScanComplete?.(submissionData);

        navigate("/");

      } catch (error) {
        console.error("Error saving submission:", error);
        alert("Failed to save submission. Try again.");
      }
    }
  };

  // -----------------------------
  // 5. Rescan
  // -----------------------------
  const handleRescan = () => {
    // Stop main camera
    stopCamera();
    
    // Stop proof camera just in case
    stopProofCamera();

    // Reset main states
    setCapturedImage(null);
    setResult(null);
    setIsAnalyzing(false);
    setScanFeedback("");
    setProofFeedback("");
    setProofOfCleaning(null);
    setLocation("");
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
              // RESULT UI WITH FORM
              // ------------------------------------
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                {/* Detection Result */}
                <div className="text-center mb-6">
                  {isDetectionValid ? (
                    <>
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✓</span>
                      </div>
                      <h2 className="text-gray-800 mb-2">{result.category}</h2>
                      <div
                        className={`inline-block px-4 py-2 rounded-full ${typeColor(
                          result.type
                        )}`}
                      >
                        {result.type.charAt(0).toUpperCase() +
                          result.type.slice(1)}
                      </div>
                      {scanFeedback && (
                        <p className="text-green-600 text-sm mt-2">{scanFeedback}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✗</span>
                      </div>
                      <h2 className="text-red-600 mb-2">Unknown Item</h2>
                      <p className="text-red-500 text-sm">Please rescan the item</p>
                    </>
                  )}
                </div>

                {/* Confidence + Points */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <span className="text-gray-600">Confidence</span>
                    <span className="text-gray-800">{result.confidence}%</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                    <span className="text-gray-600">Submit your report and clean proof to earn points!</span>
                    <span className="text-[#34A853]">+10</span>
                  </div>
                </div>

                {/* Show form only if detection is valid */}
                {isDetectionValid && (
                  <>
                    {/* Date and Time - Read Only */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-2xl">
                      <label className="text-gray-600 text-sm font-medium">
                        Scan Date & Time
                      </label>
                      <p className="text-gray-800 font-semibold">
                        {scanDateTime.toLocaleString()}
                      </p>
                    </div>

                    {/* Location Input */}
                    <div className="mb-6">
                      <label className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                        {isLocationValid && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={location}
                          onChange={handleLocationChange}
                          placeholder="Enter location or click Get Location"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={handleGetLocation}
                          disabled={isGettingLocation}
                          className="px-4 py-2 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:bg-blue-300"
                        >
                          {isGettingLocation ? "..." : "Get"}
                        </button>
                      </div>
                    </div>

                    {/* Proof of Cleaning */}
                    <div className="mb-6">
                      <label className="text-gray-700 font-semibold mb-2 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Proof of Cleaning
                        {isProofValid && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </label>

                      {isCapturingProof ? (
                        <div className="bg-black rounded-2xl overflow-hidden mb-3">
                          <video
                            ref={proofVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-48 object-cover"
                          />
                          <div className="flex gap-2 p-4">
                            <button
                              onClick={captureProofFromCamera}
                              className="flex-1 bg-green-600 text-white py-2 rounded-lg"
                            >
                              Capture
                            </button>
                            <button
                              onClick={stopProofCamera}
                              className="flex-1 bg-black-500 text-white py-2 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                          <canvas ref={proofCanvasRef} className="hidden" />
                        </div>
                      ) : proofOfCleaning ? (
                        <>
                          <img
                            src={proofOfCleaning}
                            alt="Proof of Cleaning"
                            className="w-full h-32 object-cover rounded-2xl mb-2"
                          />
                          <button
                            onClick={() => setProofOfCleaning(null)}
                            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                          >
                            Remove Proof
                          </button>
                        </>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleCaptureProof}
                            className="flex-1 bg-[#34A853]  text-white py-3 rounded-2xl flex items-center justify-center gap-2"
                          >
                            <Camera className="w-5 h-5" />
                            Capture
                          </button>
                          <button
                            onClick={() => proofFileInputRef.current?.click()}
                            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl"
                          >
                            Upload
                          </button>
                        </div>
                      )}

                      {proofFeedback && (
                        <p className="text-green-600 text-sm mt-2">{proofFeedback}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Validation Messages */}
                {!isDetectionValid && (
                  <div className="mb-6 p-4 bg-red-50 rounded-2xl text-red-600 text-sm">
                    ✗ Item type is unknown. Please rescan.
                  </div>
                )}

                {isDetectionValid && !isLocationValid && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-2xl text-yellow-700 text-sm">
                    ⚠ Please provide your location to proceed
                  </div>
                )}

                {isDetectionValid && !isProofValid && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-2xl text-yellow-700 text-sm">
                    ⚠ Please provide proof of cleaning to proceed
                  </div>
                )}

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
                    disabled={!canSave}
                    className={`flex-1 rounded-full py-3 flex items-center justify-center gap-2 transition-colors ${
                      canSave
                        ? "bg-[#34A853] text-white hover:bg-green-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <Save className="w-5 h-5" />
                    Submit
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

                <input
                  ref={proofFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleProofFileChange}
                  className="hidden"
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}