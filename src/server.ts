import app from "./app";
import config from "./config";
import { initDB } from "./db";

const main = async () => {
  try {
    
    await initDB(); 
    

    const port = config.port || 5000;
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
    process.exit(1); 
  }
};

main();