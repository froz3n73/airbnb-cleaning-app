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
      const rows = res.data || [];
      setProperties(rows.filter((p) => p.is_active !== false));
    } catch (error) {
      console.error("Load properties error:", error);
    }
  };

  const handleDeactivateProperty = async (property) => {
    const confirmed = window.confirm(
      `¿Desactivar "${property.property_name}"?`
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/admin/properties/${property.id}/deactivate`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error();

      setMessage("Propiedad desactivada");
      loadProperties();
    } catch (error) {
      console.error("Deactivate error:", error);
      setMessage("No se pudo desactivar la propiedad");
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
      setMessage("No se pudo iniciar sesión");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${API_URL}/admin/create-user`,
        {
          name: newName,
          email: newEmail,
          password: newPassword,
          role: "worker",
        },
        getTokenConfig()
      );

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      loadWorkers();
    } catch (error) {
      setMessage("Error creando trabajadora");
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
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

      setPropertyName("");
      setPropertyAddress("");
      setPropertyCity("");
      setPropertyCode("");
      setPropertyInstructions("");
      setPropertyNotes("");
      loadProperties();
    } catch (error) {
      setMessage("Error creando propiedad");
    }
  };

  const handleAssignProperty = async (e) => {
    e.preventDefault();

    if (!selectedWorker || !selectedProperty) return;

    try {
      await axios.post(
        `${API_URL}/admin/assign-property`,
        {
          user_id: selectedWorker,
          property_id: selectedProperty,
        },
        getTokenConfig()
      );

      setSelectedWorker("");
      setSelectedProperty("");
    } catch (error) {
      setMessage("Error asignando propiedad");
    }
  };

  if (user && user.role === "worker") {
    return <WorkerView user={user} onLogout={handleLogout} />;
  }

  if (user && user.role === "admin") {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h1>Admin Dashboard</h1>

          {message && <div style={styles.messageBox}>{message}</div>}

          <div style={styles.grid}>
            <div style={styles.card}>
              <h2>Crear trabajadora</h2>
              <form onSubmit={handleCreateWorker}>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre" style={styles.input} />
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" style={styles.input} />
                <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password" style={styles.input} />
                <button style={styles.primaryButton}>Crear</button>
              </form>
            </div>

            <div style={styles.card}>
              <h2>Crear propiedad</h2>
              <form onSubmit={handleCreateProperty}>
                <input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="Nombre" style={styles.input} />
                <input value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} placeholder="Dirección" style={styles.input} />
                <input value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)} placeholder="Ciudad" style={styles.input} />
                <button style={styles.primaryButton}>Crear</button>
              </form>
            </div>

            <div style={styles.card}>
              <h2>Propiedades</h2>
              <div style={styles.listBox}>
                {properties.map((p) => (
                  <div key={p.id} style={{ ...styles.listItem, display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <strong>{p.property_name}</strong>
                      <div>{p.address_line_1}</div>
                    </div>

                    <button
                      onClick={() => handleDeactivateProperty(p)}
                      style={{ background: "red", color: "white", borderRadius: "6px", padding: "6px 10px" }}
                    >
                      Deactivate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleLogin}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} />
        <button>Login</button>
      </form>
    </div>
  );
}

const styles = {
  page: { padding: 20 },
  container: { maxWidth: 1200, margin: "0 auto" },
  grid: { display: "grid", gap: 20 },
  card: { background: "#fff", padding: 20 },
  input: { display: "block", marginBottom: 10 },
  primaryButton: { padding: 10 },
  listBox: { display: "flex", flexDirection: "column", gap: 10 },
  listItem: { padding: 10, background: "#eee" },
  messageBox: { marginBottom: 10 }
};

export default App;
