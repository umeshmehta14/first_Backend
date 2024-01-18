import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [user, setUser] = useState([]);

  const getData = async () => {
    try {
      const res = await axios.get("/api/users");
      setUser(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getData();
  });

  return (
    <>
      <h1>Hello js</h1>
      <h3>users = {user.length}</h3>
      {user.map(({ id, name, age, city }) => {
        return (
          <div key={id}>
            <h1>{name}</h1>
            <p>{age}</p>
            <p>{city}</p>
          </div>
        );
      })}
    </>
  );
}

export default App;
