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
    minHeight: "100vh",
    background: "#0b1020",
    color: "#ffffff",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  loginCard: {
    maxWidth: "420px",
    margin: "60px auto",
    background: "#11182b",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "24px",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "40px",
    fontWeight: "bold",
  },
  subtitle: {
    margin: 0,
    opacity: 0.85,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#11182b",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "16px",
    fontSize: "22px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "1px solid #2a3553",
    background: "#0c1324",
    color: "#fff",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "90px",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "1px solid #2a3553",
    background: "#0c1324",
    color: "#fff",
    resize: "vertical",
  },
  primaryButton: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#88b04b",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  logoutButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#e05d5d",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    height: "fit-content",
  },
  messageBox: {
    background: "#1d2a45",
    border: "1px solid #30446f",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "16px",
  },
  listBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "320px",
    overflowY: "auto",
  },
  listItem: {
    padding: "12px",
    borderRadius: "10px",
    background: "#0c1324",
    border: "1px solid #2a3553",
  },
  smallText: {
    fontSize: "13px",
    opacity: 0.85,
    marginTop: "4px",
  },
  emptyText: {
    opacity: 0.75,
    margin: 0,
  },
};

export default App;
