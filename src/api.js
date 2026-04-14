const BASE_URL = "https://backend-mqlt.onrender.com";

export async function checkApiStatus() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchTradePartners(iso, signal) {
  const res = await fetch(
    `${BASE_URL}/trade-partners?country=${iso}`,
    { signal }
  );

  if (!res.ok) throw new Error("API request failed");

  return res.json();
}