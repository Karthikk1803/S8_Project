const http = require('http');

async function test() {
  try {
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "pioneer@recopoint.in", password: "password" })
    });
    
    console.log("Login Status:", loginRes.status);
    const cookie = loginRes.headers.get("set-cookie");
    console.log("Cookie:", cookie);

    const qRes = await fetch("http://localhost:3000/api/admin/moderation-queue", {
      headers: { "Cookie": cookie || "" }
    });
    
    console.log("Queue Status:", qRes.status);
    console.log("Queue Body:", await qRes.text());
  } catch(e) {
    console.error("Error", e);
  }
}

test();
