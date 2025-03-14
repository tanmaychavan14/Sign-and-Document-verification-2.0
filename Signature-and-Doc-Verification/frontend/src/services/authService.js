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

  // Register function (updated to include username)
  register: async (username, email, password) => {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),  // ✅ Sending username
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
    const response = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");

    return { success: true };
  },

  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem("userToken");
  },

  // Store user data after login/signup
  saveUserData: (userData) => {
    localStorage.setItem("userToken", userData.token);
    localStorage.setItem("userData", JSON.stringify(userData));
  },

  // Get current user data
  getCurrentUser: () => {
    const userDataStr = localStorage.getItem("userData");
    return userDataStr ? JSON.parse(userDataStr) : null;
  },
};

export default authService;
