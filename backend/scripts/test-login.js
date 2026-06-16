(async () => {
  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || "admin@vortex.com",
        password: process.env.ADMIN_PASSWORD || "admin123",
      }),
    });
    const data = await res.json();
    console.log("status", res.status);
    console.log("body", data);
  } catch (err) {
    console.error("error", err.message);
  }
})();
