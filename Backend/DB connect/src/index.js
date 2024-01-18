// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({ path: "./env" });
connectDB();

// import express from "express";
// import { DB_NAME } from "./constants";

// const app = express();

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (err) => {
//       console.log("Error: ", err);
//       throw err;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log("listening on port " + process.env.PORT);
//     });
//   } catch (error) {
//     console.error("ERROR: ", error);
//   }
// })();
