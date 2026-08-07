/**
 * Seeds the running API with realistic demo data:
 * a few students, a spread of Lost/Found items across categories,
 * one claim awaiting review, and one fully approved/recovered item.
 *
 * Usage: node seed-demo.js   (backend server must already be running)
 */
const BASE = `${(process.env.SEED_API_URL || "http://localhost:4000").replace(/\/$/, "")}/api`;

async function post(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${data.error}`);
  return data;
}

async function postForm(path, fields, token) {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => form.append(k, v));
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${data.error}`);
  return data;
}

async function patch(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${data.error}`);
  return data;
}

async function main() {
  console.log("Registering demo students...");
  const students = [
    { name: "Ama Serwaa", email: "ama.serwaa@knust.edu.gh", password: "password1" },
    { name: "Kojo Mensah", email: "kojo.mensah@knust.edu.gh", password: "password1" },
    { name: "Efua Owusu", email: "efua.owusu@knust.edu.gh", password: "password1" },
    { name: "Yaw Boateng", email: "yaw.boateng@knust.edu.gh", password: "password1" },
  ];
  const tokens = {};
  for (const s of students) {
    const { token } = await post("/auth/register", s);
    tokens[s.name] = token;
  }

  console.log("Creating item reports...");
  const items = [
    {
      by: "Kojo Mensah",
      title: "iPhone 13, cracked screen",
      category: "Electronics",
      description: "Black iPhone 13 with a spiderweb crack on the top-left of the screen, blue silicone case.",
      location: "KNUST Library",
      date: "2026-08-05",
      status: "Lost",
    },
    {
      by: "Ama Serwaa",
      title: "iPhone found near Unity Hall",
      category: "Electronics",
      description: "Found a black iPhone with a cracked screen and blue case on a bench near Unity Hall.",
      location: "Unity Hall",
      date: "2026-08-05",
      status: "Found",
    },
    {
      by: "Efua Owusu",
      title: "KNUST Student ID Card",
      category: "Documents",
      description: "Student ID card, name partially visible starting with 'E. O.', found near the Commercial Area.",
      location: "Commercial Area",
      date: "2026-08-04",
      status: "Found",
    },
    {
      by: "Yaw Boateng",
      title: "Navy blue backpack",
      category: "Bags",
      description: "Navy blue Adidas backpack with a laptop compartment and a KNUST SRC keychain attached to the zipper.",
      location: "Great Hall",
      date: "2026-08-06",
      status: "Lost",
    },
    {
      by: "Kojo Mensah",
      title: "Casio scientific calculator",
      category: "Electronics",
      description: "Casio fx-991ES calculator with 'K. Mensah' written in marker on the back.",
      location: "Engineering Lecture Theatre",
      date: "2026-08-03",
      status: "Lost",
    },
    {
      by: "Efua Owusu",
      title: "Bunch of keys with a Ghana flag keychain",
      category: "Keys",
      description: "Small bunch of three keys on a keyring with a small Ghana flag keychain, found near Africa Hall.",
      location: "Africa Hall",
      date: "2026-08-06",
      status: "Found",
    },
    {
      by: "Ama Serwaa",
      title: "Grey hoodie, size M",
      category: "Clothing",
      description: "Grey pullover hoodie left behind in a lecture hall, no visible name tag.",
      location: "College of Science",
      date: "2026-08-02",
      status: "Found",
    },
    {
      by: "Yaw Boateng",
      title: "USB-C charger and cable",
      category: "Electronics",
      description: "White 20W USB-C fast charger with a braided grey cable, found plugged into a wall socket and left behind.",
      location: "Library Reading Room 2",
      date: "2026-08-01",
      status: "Found",
    },
  ];

  const createdItems = {};
  for (const item of items) {
    const { item: created } = await postForm(
      "/items",
      {
        title: item.title,
        category: item.category,
        description: item.description,
        location: item.location,
        date: item.date,
        status: item.status,
      },
      tokens[item.by]
    );
    createdItems[item.title] = created;
    console.log(`  + [${item.status}] ${item.title}`);
  }

  console.log("Submitting claims...");
  // Kojo claims the found iPhone that matches his lost report
  const foundIphone = createdItems["iPhone found near Unity Hall"];
  await post(
    "/claims",
    {
      item_id: foundIphone.item_id,
      message:
        "This is my iPhone 13 — lock screen wallpaper is a sunset photo, and there's a small dent on the bottom-right corner near the charging port.",
    },
    tokens["Kojo Mensah"]
  );
  console.log(`  + Kojo Mensah claimed "iPhone found near Unity Hall" (pending review)`);

  // Efua's ID card gets claimed and approved end-to-end, so one item shows as Recovered
  const foundKeys = createdItems["Bunch of keys with a Ghana flag keychain"];
  const { claim } = await post(
    "/claims",
    {
      item_id: foundKeys.item_id,
      message: "Those are my keys — the third key is a small padlock key for my hostel trunk.",
    },
    tokens["Yaw Boateng"]
  );

  console.log("Approving one claim as admin (demonstrates full recovery flow)...");
  const { token: adminToken } = await post("/auth/login", {
    email: "admin@knust.edu.gh",
    password: "admin123",
  });
  await patch(`/claims/${claim.claim_id}`, { status: "Approved" }, adminToken);
  console.log(`  + Approved Yaw Boateng's claim on "Bunch of keys..." -> item now Recovered`);

  console.log("\nDemo data seeded successfully.");
  console.log("Student logins (all use password: password1):");
  students.forEach((s) => console.log(`  - ${s.email}`));
  console.log("Admin login: admin@knust.edu.gh / admin123");
}

main().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
