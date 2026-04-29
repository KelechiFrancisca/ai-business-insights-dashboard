import React from "react";

function UploadSection({ onUpload }) {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    fetch("http://127.0.0.1:5000/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Uploaded entries:", data);
        onUpload(data); // Pass updated list back to CashflowAnalysis
      })
      .catch((err) => console.error("Upload error:", err));
  };

  return (
    <div>
      <h3>Upload File</h3>
      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default UploadSection;
