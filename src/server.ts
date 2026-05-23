import app from "./app";
import config from "./config";
import { initDB } from "./db";

const main = async () => {
  try {
    // সার্ভার চালু হওয়ার আগেই নিশ্চিত করা হচ্ছে ডেটাবেজ টেবিল তৈরি হয়েছে
    await initDB(); 
    
    // Vercel-এর জন্য পোর্ট হ্যান্ডেল করা (config.port না পেলে যেন ডিফল্ট ৫০00 নেয়)
    const port = config.port || 5000;
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Server failed to start:", err);
    process.exit(1); // কোনো বড় এরর হলে প্রসেসটি বন্ধ করবে
  }
};

main();