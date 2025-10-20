export const reactions = [
  "👍",
  "❤️",
  "🤠",
  "😂",
  "🥰",
  "😮",
  "😢",
  "😣",
  "😡",
  "👏",
  "🎉",
  "🔥",
];

export const displayReaction = (reaction: string) => {
  if (!reactions.includes(reaction)) return;

  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const reactionElem = document.createElement("div");
      reactionElem.className =
        "animate-reaction absolute text-5xl opacity-0 pointer-events-none";
      reactionElem.style.left = `${Math.random() * 80 + 10}%`;
      reactionElem.style.bottom = `${Math.random() * 80 + 10}%`;
      reactionElem.textContent = reaction;
      document.body.appendChild(reactionElem);
      setTimeout(() => {
        reactionElem.remove();
      }, 2000);
    }, i * 50);
  }
};
