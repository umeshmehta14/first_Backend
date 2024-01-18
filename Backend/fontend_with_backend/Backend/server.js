import express from "express";

const app = express();

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Welcome to Express");
});

app.get("/api/users", (req, res) => {
  const myObject = [
    { id: 1, name: "Alice", age: 25, city: "New York" },
    { id: 2, name: "Bob", age: 30, city: "San Francisco" },
    { id: 3, name: "Charlie", age: 22, city: "Los Angeles" },
    { id: 4, name: "David", age: 28, city: "Chicago" },
    { id: 5, name: "Eva", age: 35, city: "Miami" },
  ];

  res.json(myObject);
});

app.listen(port, (req, res) => {
  console.log(`listening on port ${port}`);
});
