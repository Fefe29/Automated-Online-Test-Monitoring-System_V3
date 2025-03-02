import { useState, useRef } from "react";
import { Webcam } from "../utils/webcam";

const ButtonHandler = ({ imageRef, cameraRef, videoRef, toggleSession, sessionActive, summary }) => {
  const [streaming, setStreaming] = useState(null);
  const inputImageRef = useRef(null);
  const inputVideoRef = useRef(null);
  const webcam = new Webcam();

  // 🔹 États pour la modale et les emails
  const [showModal, setShowModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [controlEmail, setControlEmail] = useState("");

  const sendEmail = async () => {
    if (!userEmail || !controlEmail) {
      alert("❌ Veuillez renseigner les deux adresses email.");
      return;
    }
  
    console.log("📊 Résultats YOLO envoyés :", summary);  // ✅ Vérifier les résultats dans la console
  
    const emailData = {
      user_email: userEmail,
      control_email: controlEmail,
      results: summary,  // ✅ Envoie les vrais résultats
    };
  
    try {
      const response = await fetch("http://127.0.0.1:5000/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });
  
      const data = await response.json();
      if (response.ok) {
        alert("📩 Email envoyé avec succès !");
      } else {
        alert("❌ Erreur d'envoi : " + data.error);
      }
    } catch (error) {
      alert("❌ Impossible d'envoyer l'email : " + error.message);
    }
  };

  // 🔹 Ouvrir la caméra frontale après validation des emails
  const openFrontCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      cameraRef.current.srcObject = stream;
      cameraRef.current.style.display = "block";
      setStreaming("frontCamera");
      toggleSession();
    } catch (error) {
      alert("Erreur d'accès à la caméra : " + error.message);
    }
  };

  // 🔹 Fermer la caméra frontale et envoyer l'email
  const closeFrontCamera = () => {
    const tracks = cameraRef.current.srcObject?.getTracks();
    tracks?.forEach((track) => track.stop());
    cameraRef.current.srcObject = null;
    cameraRef.current.style.display = "none";
    setStreaming(null);
    toggleSession();

    // 🔹 Envoyer l'email après fermeture de la session
    sendEmail();
  };

  // 🔹 Gérer la soumission du formulaire dans la modale
  const handleStartSession = () => {
    if (!userEmail || !controlEmail) {
      alert("❌ Veuillez renseigner les deux adresses email.");
      return;
    }
    setShowModal(false); // Fermer la fenêtre modale
    openFrontCamera(); // Démarrer la caméra après validation
  };

  return (
    <div className="btn-container">
      {/* Bouton principal pour démarrer/arrêter la session */}
      <button
        onClick={() => {
          if (streaming === null || streaming !== "frontCamera") {
            if (streaming === "camera") webcam.close(cameraRef.current);
            setShowModal(true); // Afficher la modale avant de démarrer la session
          } else {
            closeFrontCamera();
          }
        }}
      >
        {streaming === "frontCamera" ? "Fermer la session" : "Démarrer la session"}
      </button>

      {/* Modale pour saisir les emails avant de commencer */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Informations de session</h2>
            <input
              type="email"
              placeholder="Votre email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email de contrôle"
              value={controlEmail}
              onChange={(e) => setControlEmail(e.target.value)}
              required
            />
            <button onClick={handleStartSession}>Démarrer la session</button>
            <button onClick={() => setShowModal(false)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ButtonHandler;
