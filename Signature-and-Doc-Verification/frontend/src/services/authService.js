const BASE_URL = "http://localhost:4000/api/auth";

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

    const userData = await response.json();
    authService.saveUserData(userData);
    return userData;
  },

  // Register function
  register: async (username, email, password) => {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Registration Error:", errorData.message);
      throw new Error(errorData.message || "Registration failed");
    }

    return await response.json();
  },

  // Logout function
  logout: async () => {
    try {
      const token = localStorage.getItem("userToken");
  
      // If no token, just return success instead of throwing an error
      if (!token) {
        console.warn("No token found. Already logged out.");
        return { success: true };
      }
  
      const response = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.message || "Logout failed");
      }
  
      console.log("Logout successful");
  
      // Clear local storage
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
  
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error.message);
      return { success: false, message: error.message };
    }
  },
  

  // ✅ Add isAuthenticated function
  isAuthenticated: () => {
    const token = localStorage.getItem("userToken");
    return !!token; // Returns true if token exists, otherwise false
  },

  // ✅ Add getCurrentUser function
  getCurrentUser: () => {
    const user = localStorage.getItem("userData");
    return user ? JSON.parse(user) : null;
  },

  // ✅ Add saveUserData function
  saveUserData: (userData) => {
    localStorage.setItem("userToken", userData.token); // Save token
    localStorage.setItem("userData", JSON.stringify(userData)); // Save user data
  },
};

export default authService;
