import React, { useState } from "react";

function EntrySection({ onAdd }) {
  const [category, setCategory] = useState("income");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const handleAddEntry = () => {
    if (!description || !amount || !date) return;

    const newEntry = {
      category,
      description,
      amount: parseFloat(amount),
      date,
    };

    // Send entry to Flask backend
    fetch("http://127.0.0.1:5000/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Updated entries:", data);
        onAdd(data); // update parent state with backend response
        setDescription("");
        setAmount("");
        setCategory("income");
        setDate("");
      })
      .catch((err) => console.error("Add entry error:", err));
  };

  return (
    <div className="add-entry card">
      <h3>Add Entry</h3>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button onClick={handleAddEntry}>Add</button>
    </div>
  );
}

export default EntrySection;
