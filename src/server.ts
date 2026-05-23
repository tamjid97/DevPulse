import app from "./app";
import config from "./config";
import { initDB } from "./db";

const main = async () => {
  try {
    await initDB(); // IMPORTANT: await add
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error(err);
  }
};

main();