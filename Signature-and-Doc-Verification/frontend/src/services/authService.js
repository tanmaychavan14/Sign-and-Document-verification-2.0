const BASE_URL = "http://localhost:4000/api/auth";
const SIGNATURE_URL = "http://localhost:4000/api/signatures";

const authService = {
  // Login function
  login: async (email, password) => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error("Invalid email or password");
    }
    const data = await response.json();
    localStorage.setItem("userToken", data.token);
    localStorage.setItem("userData", JSON.stringify(data.user));
    
    return data.user;
  },
  
  // Register function
  register: async (username, email, password, profilePicture = null, originalSignature = null) => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    
    if (profilePicture) {
      formData.append("profilePicture", profilePicture);
    }
    
    if (originalSignature) {
      formData.append("originalSignature", originalSignature);
    }
    
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed");
    }
    
    return await response.json();
  },
  
  // Logout function
  logout: async () => {
    try {
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        console.warn("No token found. Already logged out.");
        return { success: true };
      }
      
      const response = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.message || "Logout failed");
      }
      
      // Clear local storage
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error.message);
      return { success: false, message: error.message };
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem("userToken");
    return !!token;
  },
  
  // Get current user from localStorage or backend if needed
  getCurrentUser: async () => {
    try {
      // First check localStorage
      const userData = localStorage.getItem("userData");
      if (userData) {
        return JSON.parse(userData);
      }
      
      // If not in localStorage, fetch from API
      const token = localStorage.getItem("userToken");
      if (!token) {
        return null;
      }
      
      const response = await fetch(`${BASE_URL}/profile`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("userData", JSON.stringify(data.user));
        return data.user;
      } else {
        throw new Error("Unable to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  },
  
  // Upload reference signature
  uploadReferenceSignature: async (signatureFile, description = "Reference signature") => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const formData = new FormData();
      formData.append("signature", signatureFile);
      formData.append("description", description);
      
      const response = await fetch(`${SIGNATURE_URL}/reference`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload reference signature");
      }
      
      // Update user data in local storage after uploading reference signature
      const user = await authService.getCurrentUser();
      
      return await response.json();
    } catch (error) {
      console.error("Error uploading reference signature:", error);
      throw error;
    }
  },
  
  // Verify signature
  verifySignature: async (verificationSignature) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const formData = new FormData();
      formData.append("verification_signature", verificationSignature);
      
      const response = await fetch(`${SIGNATURE_URL}/verify`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signature verification failed");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error verifying signature:", error);
      throw error;
    }
  },
  
  // Update profile data
  updateProfile: async (userData) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const formData = new FormData();
      
      // Add all user data to formData
      Object.keys(userData).forEach(key => {
        if (userData[key] instanceof File) {
          formData.append(key, userData[key]);
        } else if (userData[key] !== null && userData[key] !== undefined) {
          formData.append(key, userData[key]);
        }
      });
      
      const response = await fetch(`${BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      const data = await response.json();
      localStorage.setItem("userData", JSON.stringify(data.user));
      
      return data.user;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },
  
  // Get user's reference signatures
  getUserSignatures: async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const response = await fetch(`${SIGNATURE_URL}/references`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get signatures");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error getting signatures:", error);
      throw error;
    }
  },
  getVerificationHistory: async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${BASE_URL}/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get verification history");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting verification history:", error);
      throw error;
    }
  },
  
};

export default authService;