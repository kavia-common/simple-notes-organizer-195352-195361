import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app shell", () => {
  render(<App />);
  expect(screen.getByText(/Ocean Notes/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Create new note/i })).toBeInTheDocument();
});
