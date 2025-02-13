import { tag, text } from "./html";
import { signal } from "./signal";

export function Button() {
  const count = signal(0);

  return tag(
    "button",
    { class: "hi" },
    {
      click() {
        console.log("clicked", count.value);
        count.value++;
      },
    },
    [text`Count: ${count}`]
  );
}
