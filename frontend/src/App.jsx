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
      setProperties(res.data || []);
    } catch (error) {
      console.error("Load properties error:", error);
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

    if (!selectedWorker || !selectedProperty) {
      setMessage("Selecciona trabajadora y propiedad");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/assign-property`,
        {
          user_id: selectedWorker,
          property_id: selectedProperty,
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

      setMessage(`Asignación exitosa: ${propertyNameText} → ${workerName}`);
      setSelectedWorker("");
      setSelectedProperty("");
    } catch (error) {
      console.error("Assign property error:", error);
      setMessage(
        error?.response?.data?.error || "No se pudo asignar la propiedad"
      );
    }
  };

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
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Crear trabajadora</h2>

              <form onSubmit={handleCreateWorker}>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={styles.input}
                  required
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={styles.input}
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.input}
                  required
                />

                <button type="submit" style={styles.primaryButton}>
                  Crear trabajadora
                </button>
              </form>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Crear propiedad</h2>

              <form onSubmit={handleCreateProperty}>
                <input
                  type="text"
                  placeholder="Nombre de propiedad"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  style={styles.input}
                  required
                />

                <input
                  type="text"
                  placeholder="Dirección"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  style={styles.input}
                  required
                />

                <input
                  type="text"
                  placeholder="Ciudad"
                  value={propertyCity}
                  onChange={(e) => setPropertyCity(e.target.value)}
                  style={styles.input}
                  required
                />

                <input
                  type="text"
                  placeholder="Door code"
                  value={propertyCode}
                  onChange={(e) => setPropertyCode(e.target.value)}
                  style={styles.input}
                />

                <textarea
                  placeholder="Instrucciones de entrada"
                  value={propertyInstructions}
                  onChange={(e) => setPropertyInstructions(e.target.value)}
                  style={styles.textarea}
                />

                <textarea
                  placeholder="Notas"
                  value={propertyNotes}
                  onChange={(e) => setPropertyNotes(e.target.value)}
                  style={styles.textarea}
                />

                <button type="submit" style={styles.primaryButton}>
                  Crear propiedad
                </button>
              </form>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Asignar propiedad</h2>

              <form onSubmit={handleAssignProperty}>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  style={styles.input}
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
                  style={styles.input}
                  required
                >
                  <option value="">Selecciona propiedad</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.property_name} — {property.city}
                    </option>
                  ))}
                </select>

                <button type="submit" style={styles.primaryButton}>
                  Asignar propiedad
                </button>
              </form>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Trabajadoras</h2>
              <div style={styles.listBox}>
                {workers.length === 0 ? (
                  <p style={styles.emptyText}>No hay trabajadoras todavía</p>
                ) : (
                  workers.map((worker) => (
                    <div key={worker.id} style={styles.listItem}>
                      <strong>{worker.name}</strong>
                      <div style={styles.smallText}>{worker.email}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Propiedades</h2>
              <div style={styles.listBox}>
                {properties.length === 0 ? (
                  <p style={styles.emptyText}>No hay propiedades todavía</p>
                ) : (
                  properties.map((property) => (
                    <div key={property.id} style={styles.listItem}>
                      <strong>{property.property_name}</strong>
                      <div style={styles.smallText}>
                        {property.address_line_1}, {property.city}
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
            style={styles.input}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
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

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#f0f2f5",
    color: "#1a1f2e",
    padding: "clamp(12px, 4vw, 30px)",
    paddingTop: "max(clamp(12px, 4vw, 30px), env(safe-area-inset-top))",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  loginCard: {
    maxWidth: "420px",
    margin: "clamp(24px, 8vw, 60px) auto",
    width: "min(100%, 420px)",
    background: "#ffffff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow:
      "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)",
    border: "1px solid #e8eaef",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "clamp(1.5rem, 5vw, 2rem)",
    fontWeight: "700",
    color: "#111827",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "15px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: "clamp(14px, 3vw, 20px)",
  },
  card: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "22px",
    boxShadow:
      "0 1px 3px rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.04)",
    border: "1px solid #e8eaef",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "16px",
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
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
  primaryButton: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#5a9a3e",
    color: "#fff",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  logoutButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#64748b",
    fontWeight: "600",
    cursor: "pointer",
    height: "fit-content",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  messageBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "12px 14px",
    marginBottom: "16px",
    color: "#334155",
    fontSize: "14px",
  },
  listBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "320px",
    overflowY: "auto",
  },
  listItem: {
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e8eaef",
  },
  smallText: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
  },
  emptyText: {
    color: "#94a3b8",
    margin: 0,
    fontSize: "14px",
  },
};

export default App;
