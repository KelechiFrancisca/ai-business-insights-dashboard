import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [profile, setProfile] = useState({ name: "", email: "", role: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to view your profile.");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setProfile(data);
        } else {
          alert(data.error || "Failed to load profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        alert("Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Server error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("Logged out successfully!");
    navigate("/login");
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      <input
        type="text"
        name="name"
        placeholder="Name"
        className="w-full mb-3 p-2 border rounded"
        value={profile.name}
        onChange={handleChange}
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        className="w-full mb-3 p-2 border rounded"
        value={profile.email}
        onChange={handleChange}
      />
      <input
        type="text"
        name="role"
        placeholder="Role"
        className="w-full mb-3 p-2 border rounded"
        value={profile.role}
        onChange={handleChange}
      />
      <button
        onClick={handleSave}
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mb-3"
      >
        Save Profile
      </button>
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}

export default Profile;
