import express from "express";

const app = express();

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Welcome to Express");
});

app.get("/list", (req, res) => {
  const myObject = {
    array1: [1, 2, 3, 4, 5],
    array2: ["apple", "banana", "orange"],
    array3: [true, false, true, true],
    array4: [10.5, 20.3, 15.8],
    array5: [
      ["a", "b", "c"],
      [1, 2, 3, 4],
    ],
  };

  res.json(myObject);
});

app.listen(port, (req, res) => {
  console.log(`listening on port ${port}`);
});
