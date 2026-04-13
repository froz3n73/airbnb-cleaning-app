import { useState, useEffect } from "react";
import axios from "axios";
import WorkerView from "./WorkerView";
import { getTokenConfig } from "./authConfig";

function App() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  const [message, setMessage] = useState("");

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [propertyName, setPropertyName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyCode, setPropertyCode] = useState("");
  const [propertyInstructions, setPropertyInstructions] = useState("");
  const [propertyNotes, setPropertyNotes] = useState("");

  const [workers, setWorkers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      loadWorkers();
      loadProperties();
    }
  }, [user]);

  const loadWorkers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/workers`, getTokenConfig());
      setWorkers(res.data || []);
    } catch (error) {
      console.error("Load workers error:", error);
    }
  };

  const loadProperties = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/admin/properties`,
        getTokenConfig()
      );
      const rows = res.data || [];
      setProperties(rows.filter((p) => p.is_active !== false));
    } catch (error) {
      console.error("Load properties error:", error);
    }
  };

  const handleDeactivateProperty = async (property) => {
    const label = property.property_name || "this property";
    if (
      !window.confirm(
        `Deactivate "${label}"? It will be hidden from this list.`
      )
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_URL}/admin/properties/${property.id}/deactivate`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        let errText = "Could not deactivate property";
        try {
          const body = await res.json();
          if (body?.error) errText = body.error;
        } catch {
          /* ignore */
        }
        setMessage(errText);
        return;
      }

      setMessage(`Deactivated: ${label}`);
      await loadProperties();
    } catch (error) {
      console.error("Deactivate property error:", error);
      setMessage("Could not deactivate property");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setUser(res.data.user);
      setMessage("");
    } catch (error) {
      console.error("Login error:", error);
      setMessage("No se pudo iniciar sesión");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setEmail("");
    setPassword("");
    setMessage("");
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${API_URL}/admin/create-user`,
        {
          name: newName,
          email: newEmail,
          password: newPassword,
          role: "worker",
        },
        getTokenConfig()
      );

      setMessage(`Trabajadora creada: ${res.data.name} (${res.data.email})`);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      loadWorkers();
    } catch (error) {
      console.error("Create worker error:", error);
      setMessage(
        error?.response?.data?.error || "No se pudo crear la trabajadora"
      );
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${API_URL}/admin/create-property`,
        {
          property_name: propertyName,
          address_line_1: propertyAddress,
          city: propertyCity,
          door_code: propertyCode,
          entry_instructions: propertyInstructions,
          notes: propertyNotes,
        },
        getTokenConfig()
      );

      setMessage(`Propiedad creada: ${res.data.property_name}`);
      setPropertyName("");
      setPropertyAddress("");
      setPropertyCity("");
      setPropertyCode("");
      setPropertyInstructions("");
      setPropertyNotes("");
      loadProperties();
    } catch (error) {
      console.error("Create property error:", error);
      setMessage(
        error?.response?.data?.error || "No se pudo crear la propiedad"
      );
    }
  };

  const handleAssignProperty = async (e) => {
    e.preventDefault();

    if (!selectedWorker || !selectedProperty || !selectedDate) {
      setMessage("Selecciona trabajadora, propiedad y fecha");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/assign-property`,
        {
          user_id: selectedWorker,
          property_id: selectedProperty,
          assigned_date: selectedDate,
        },
        getTokenConfig()
      );

      const workerName =
        workers.find((w) => String(w.id) === String(selectedWorker))?.name ||
        "Trabajadora";

      const propertyNameText =
        properties.find(
          (p) => String(p.id) === String(selectedProperty)
        )?.property_name || "Propiedad";

      setMessage(
        `Asignación exitosa: ${propertyNameText} → ${workerName} (${selectedDate})`
      );
      setSelectedWorker("");
      setSelectedProperty("");
      setSelectedDate("");
    } catch (error) {
      console.error("Assign property error:", error);
      setMessage(
        error?.response?.data?.error || "No se pudo asignar la propiedad"
      );
    }
  };

  // --------- CLEAN ADMIN UI LAYOUT ---------
  if (user && user.role === "worker") {
    return <WorkerView user={user} onLogout={handleLogout} />;
  }

  if (user && user.role === "admin") {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.title}>Admin Dashboard</h1>
              <p style={styles.subtitle}>Bienvenido {user.name}</p>
            </div>
            <button style={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </div>
          {message && <div style={styles.messageBox}>{message}</div>}

          <div style={styles.grid}>
            {/* Crear trabajadora */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Crear trabajadora</h2>
              <form onSubmit={handleCreateWorker}>
                <div style={styles.formGroup}>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={styles.inputEnhanced}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={styles.inputEnhanced}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={styles.inputEnhanced}
                    required
                  />
                </div>
                <button type="submit" style={styles.primaryButton}>
                  Crear trabajadora
                </button>
              </form>
            </div>

            {/* Crear propiedad */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Crear propiedad</h2>
              <form onSubmit={handleCreateProperty}>
                <div style={styles.formGroup}>
                  <input
                    type="text"
                    placeholder="Nombre de propiedad"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    style={styles.inputEnhanced}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Dirección"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    style={styles.inputEnhanced}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Ciudad"
                    value={propertyCity}
                    onChange={(e) => setPropertyCity(e.target.value)}
                    style={styles.inputEnhanced}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Door code"
                    value={propertyCode}
                    onChange={(e) => setPropertyCode(e.target.value)}
                    style={styles.inputEnhanced}
                  />
                  <textarea
                    placeholder="Instrucciones de entrada"
                    value={propertyInstructions}
                    onChange={(e) => setPropertyInstructions(e.target.value)}
                    style={styles.textareaEnhanced}
                  />
                  <textarea
                    placeholder="Notas"
                    value={propertyNotes}
                    onChange={(e) => setPropertyNotes(e.target.value)}
                    style={styles.textareaEnhanced}
                  />
                </div>
                <button type="submit" style={styles.primaryButton}>
                  Crear propiedad
                </button>
              </form>
            </div>

            {/* Asignar propiedad */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Asignar propiedad</h2>
              <form onSubmit={handleAssignProperty}>
                <div style={styles.formGroup}>
                  <select
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                    style={styles.inputEnhanced}
                    required
                  >
                    <option value="">Selecciona trabajadora</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} — {worker.email}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    style={styles.inputEnhanced}
                    required
                  >
                    <option value="">Selecciona propiedad</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.property_name} — {property.city}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={styles.inputEnhanced}
                    required
                  />
                </div>
                <button type="submit" style={styles.primaryButton}>
                  Asignar propiedad
                </button>
              </form>
            </div>

            {/* Listado de trabajadoras */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Trabajadoras</h2>
              <div style={styles.listBoxEnhanced}>
                {workers.length === 0 ? (
                  <p style={styles.emptyText}>No hay trabajadoras todavía</p>
                ) : (
                  workers.map((worker) => (
                    <div key={worker.id} style={styles.listItemEnhanced}>
                      <div>
                        <strong>{worker.name}</strong>
                        <div style={styles.smallText}>{worker.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Listado de propiedades */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Propiedades</h2>
              <div style={styles.listBoxEnhanced}>
                {properties.length === 0 ? (
                  <p style={styles.emptyText}>No hay propiedades todavía</p>
                ) : (
                  properties.map((property) => (
                    <div key={property.id} style={styles.listItemEnhanced}>
                      <div style={styles.propertyRowEnhanced}>
                        <div style={styles.propertyMainEnhanced}>
                          <strong>{property.property_name}</strong>
                          <div style={styles.smallText}>
                            {property.address_line_1}, {property.city}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <button
                            type="button"
                            style={styles.dangerButtonEnhanced}
                            onClick={() => handleDeactivateProperty(property)}
                          >
                            Deactivate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login view
  return (
    <div style={styles.page}>
      <div style={styles.loginCard}>
        <h1 style={styles.title}>Login</h1>
        {message && <div style={styles.messageBox}>{message}</div>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.inputEnhanced}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.inputEnhanced}
            required
          />
          <button type="submit" style={styles.primaryButton}>
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Improved and enhanced styles ---
const styles = {
  page: {
    minHeight: "100dvh",
    background: "#f4f6fa",
    color: "#1a1f2e",
    padding: "clamp(16px, 4vw, 36px)",
    paddingTop: "max(clamp(16px, 4vw, 36px), env(safe-area-inset-top))",
    boxSizing: "border-box",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  },
  container: {
    maxWidth: "1240px",
    margin: "0 auto",
    width: "100%",
  },
  loginCard: {
    maxWidth: "420px",
    margin: "clamp(36px, 9vw, 70px) auto",
    width: "min(100%, 440px)",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "36px 32px 28px 32px",
    boxShadow:
      "0 3px 12px 0 rgba(11, 31, 56, 0.07), 0 7px 50px 0 rgba(11, 31, 56, 0.09)",
    border: "1px solid #e7eaf1",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "32px",
  },
  title: {
    margin: "0 0 5px 0",
    fontSize: "clamp(1.7rem, 5vw, 2.2rem)",
    fontWeight: "700",
    color: "#1a2437",
    letterSpacing: "-0.018em",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "400",
    letterSpacing: "-0.015em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
    gap: "26px",
    marginBottom: "32px",
    alignItems: "stretch",
  },
  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "28px 22px 26px 22px",
    boxShadow:
      "0 1px 3px 0 rgba(10, 30, 50, 0.034), 0 8px 24px 0 rgba(10,30,50,0.045)",
    border: "1px solid #e7eaf1",
    display: "flex",
    flexDirection: "column",
    minHeight: "0",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "18px",
    fontSize: "19px",
    fontWeight: "600",
    color: "#1a2437",
    letterSpacing: "-0.009em",
  },
  primaryButton: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: "11px",
    border: "none",
    background: "#55a83b",
    color: "#fff",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "4px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    transition: "background 0.17s",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontSize: "15px",
  },
  inputEnhanced: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    marginBottom: "14px",
    borderRadius: "12px",
    border: "1px solid #d3d7de",
    background: "#fafbfc",
    color: "#232b39",
    fontSize: "16px",
    transition: "border 0.18s",
    outline: "none",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "90px",
    padding: "12px 14px",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontSize: "15px",
    resize: "vertical",
  },
  textareaEnhanced: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "85px",
    padding: "13px 14px",
    marginBottom: "13px",
    borderRadius: "12px",
    border: "1px solid #d3d7de",
    background: "#fafbfc",
    color: "#232b39",
    fontSize: "16px",
    resize: "vertical",
    transition: "border 0.18s",
    outline: "none",
  },
  logoutButton: {
    padding: "11px 18px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#f7fafc",
    color: "#5f677a",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "15px",
    height: "fit-content",
    boxShadow: "0 1px 2px rgba(0,0,0,0.045)",
    transition: "background 0.17s",
  },
  messageBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "13px 16px",
    marginBottom: "24px",
    color: "#374151",
    fontSize: "15px",
    fontWeight: "500",
    wordBreak: "break-word",
  },
  listBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "320px",
    overflowY: "auto",
  },
  listBoxEnhanced: {
    display: "flex",
    flexDirection: "column",
    gap: "13px",
    maxHeight: "342px",
    overflowY: "auto",
    marginBottom: "-8px",
  },
  listItem: {
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e8eaef",
  },
  listItemEnhanced: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "15px 17px",
    borderRadius: "12px",
    background: "#f7fafd",
    border: "1px solid #eef0f6",
    minHeight: "44px",
  },
  propertyRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },
  propertyRowEnhanced: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: "18px",
  },
  propertyMain: {
    minWidth: 0,
    flex: 1,
  },
  propertyMainEnhanced: {
    minWidth: 0,
    flex: 1,
    paddingRight: "10px",
    overflow: "hidden",
  },
  dangerButton: {
    flexShrink: 0,
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #fecaca",
    background: "#fff",
    color: "#b91c1c",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
  dangerButtonEnhanced: {
    flexShrink: 0,
    padding: "8px 15px",
    borderRadius: "9px",
    border: "1px solid #ffcfcf",
    background: "#fff",
    color: "#ce2727",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    marginLeft: "12px",
    transition: "background 0.16s, border 0.16s, color 0.16s",
    alignSelf: "center",
    minHeight: "33px",
  },
  smallText: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
    wordBreak: "break-word",
  },
  emptyText: {
    color: "#b0bccc",
    margin: 0,
    fontSize: "15px",
    textAlign: "center",
    padding: "12px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
    marginBottom: "4px",
  },
};

export default App;
