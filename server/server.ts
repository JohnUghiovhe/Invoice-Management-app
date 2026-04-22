import "dotenv/config";
 import { app } from "./app";

const PORT = Number(process.env.PORT ?? 4000);

app.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
