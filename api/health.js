export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    app: "Chase Prime Bank Vercel API"
  });
}
