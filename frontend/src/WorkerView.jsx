import { useEffect, useState } from "react";
import axios from "axios";

export default function WorkerView({ user, onLogout }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedItem, setCopiedItem] = useState("");
 const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (user?.id) {
      loadProperties();
    }
  }, [user]);

  const loadProperties = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/properties/${user.id}`);
      setProperties(res.data || []);
    } catch (error) {
      console.error("Error cargando propiedades:", error);
      alert("No se pudieron cargar las propiedades asignadas");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopiedItem(label);

      setTimeout(() => {
        setCopiedItem("");
      }, 1500);
    } catch (error) {
      console.error("Error copiando texto:", error);
      alert("No se pudo copiar");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Mis casas</h1>
            <p style={styles.subtitle}>Hola, {user?.name || "Trabajadora"}</p>
          </div>

          <div style={styles.headerButtons}>
            <button style={styles.refreshButton} onClick={loadProperties}>
              Actualizar
            </button>

            <button style={styles.logoutButton} onClick={onLogout}>
              Salir
            </button>
          </div>
        </div>

        {loading ? (
          <div style={styles.messageBox}>Cargando propiedades...</div>
        ) : properties.length === 0 ? (
          <div style={styles.messageBox}>
            No tienes propiedades asignadas por ahora.
          </div>
        ) : (
          <div style={styles.cardsGrid}>
            {properties.map((property) => (
              <div key={property.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <h2 style={styles.propertyName}>
                    {property.property_name || "Propiedad"}
                  </h2>
                  <span style={styles.cityBadge}>
                    {property.city || "Sin ciudad"}
                  </span>
                </div>

                <div style={styles.section}>
                  <p style={styles.label}>Dirección</p>
                  <p style={styles.value}>
                    {property.address_line_1 || "Sin dirección"}
                  </p>
                  <button
                    style={styles.secondaryButton}
                    onClick={() =>
                      copyText(
                        `${property.address_line_1 || ""}${
                          property.city ? `, ${property.city}` : ""
                        }`,
                        `address-${property.id}`
                      )
                    }
                  >
                    {copiedItem === `address-${property.id}`
                      ? "Dirección copiada"
                      : "Copiar dirección"}
                  </button>
                  <button
  style={{ ...styles.secondaryButton, marginTop: "8px" }}
  onClick={() => {
    const address = `${property.address_line_1 || ""} ${property.city || ""}`;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
      "_blank"
    );
  }}
>
  Abrir en Maps
</button>
                </div>

                <div style={styles.codeBox}>
                  <p style={styles.codeLabel}>Código de entrada</p>
                  <p style={styles.codeValue}>{property.door_code || "N/A"}</p>
                  <button
                    style={styles.primaryButton}
                    onClick={() =>
                      copyText(property.door_code || "", `code-${property.id}`)
                    }
                  >
                    {copiedItem === `code-${property.id}`
                      ? "Código copiado"
                      : "Copiar código"}
                  </button>
                </div>

                <div style={styles.section}>
                  <p style={styles.label}>Instrucciones</p>
                  <p style={styles.notesText}>
                    {property.entry_instructions || "No hay instrucciones"}
                  </p>
                </div>

                <div style={styles.section}>
                  <p style={styles.label}>Notas</p>
                  <p style={styles.notesText}>
                    {property.notes || "No hay notas"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f7f4",
    padding: "12px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    color: "#1f3b2d",
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "6px 0 0 0",
    color: "#557565",
    fontSize: "15px",
  },
  headerButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    width: "100%",
  },
  refreshButton: {
    backgroundColor: "#dbe8d8",
    color: "#1f3b2d",
    border: "none",
    padding: "12px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    flex: 1,
    minWidth: "120px",
    fontSize: "15px",
  },
  logoutButton: {
    backgroundColor: "#1f3b2d",
    color: "white",
    border: "none",
    padding: "12px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    flex: 1,
    minWidth: "120px",
    fontSize: "15px",
  },
  messageBox: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    textAlign: "center",
    color: "#4f4f4f",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "14px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.07)",
    border: "1px solid #e7efe5",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  propertyName: {
    margin: 0,
    fontSize: "21px",
    color: "#1f3b2d",
    lineHeight: 1.2,
  },
  cityBadge: {
    backgroundColor: "#e8f3e5",
    color: "#2d5a3d",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  section: {
    marginBottom: "14px",
  },
  label: {
    margin: "0 0 6px 0",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#557565",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  value: {
    margin: "0 0 10px 0",
    fontSize: "15px",
    color: "#1f1f1f",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  notesText: {
    margin: 0,
    fontSize: "14px",
    color: "#333",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  codeBox: {
    backgroundColor: "#f7fbf6",
    border: "1px solid #d9ead7",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "14px",
  },
  codeLabel: {
    margin: "0 0 8px 0",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#557565",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  codeValue: {
    margin: "0 0 12px 0",
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1f3b2d",
    wordBreak: "break-word",
    lineHeight: 1.1,
  },
  primaryButton: {
    backgroundColor: "#88b04b",
    color: "white",
    border: "none",
    padding: "14px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    fontSize: "15px",
  },
  secondaryButton: {
    backgroundColor: "#eef4ed",
    color: "#1f3b2d",
    border: "1px solid #d7e5d4",
    padding: "12px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    fontSize: "15px",
  },
};
