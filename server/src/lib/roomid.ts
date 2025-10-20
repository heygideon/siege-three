// https://github.com/1Password/spg/blob/master/testdata/agwordlist.txt
const wordList = Bun.file("src/lib/wordlist.txt").text();

export async function generateRoomId(): Promise<string> {
  const words = (await wordList).split("\n");
  const randomWords = [];
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    randomWords.push(words[randomIndex].trim());
  }
  return randomWords.join("-");
}
