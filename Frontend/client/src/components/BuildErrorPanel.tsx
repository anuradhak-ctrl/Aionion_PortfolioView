import React, { useEffect, useState } from "react";

export default function BuildErrorPanel() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/dist/build-error.json")
      .then((res) => {
        if (!res.ok) throw new Error("No build error");
        return res.json();
      })
      .then((data) => setError(data.error + (data.stack ? "\n" + data.stack : "")))
      .catch(() => setError(null));
  }, []);

  if (!error) return null;
  return (
    <div style={{ background: "#fee", color: "#900", padding: 16, border: "1px solid #900", margin: 16 }}>
      <h2>Build Error</h2>
      <pre>{error}</pre>
    </div>
  );
}
