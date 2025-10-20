// https://animate.style/#javascript
export const animateCSS = (
  node: Element,
  animation: string,
  prefix = "animate__",
) =>
  new Promise<void>((resolve) => {
    const animationName = `${prefix}${animation}`;

    node.classList.add(`${prefix}animated`, animationName);

    node.addEventListener(
      "animationend",
      (ev) => {
        // When the animation ends, we clean the classes and resolve the Promise
        ev.stopPropagation();
        node.classList.remove(`${prefix}animated`, animationName);
        resolve();
      },
      { once: true },
    );
  });
